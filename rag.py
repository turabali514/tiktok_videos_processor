# rag_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from create_vector_db import get_vector_store
from typing import List, Any
import concurrent.futures,json
from db import get_videos_for_user

# ✅ Shared setup
store = get_vector_store()
llm = ChatOpenAI(model="gpt-4o-mini",temperature=0.5)
output_parser = StrOutputParser()

# ✅ Prompt Template
prompt_template = PromptTemplate.from_template("""
Act as a Social Media Expert, who uses the transcript as the only source to answer the user queries, helping him in achiving his goals. remmeber not to mention that you are using transcript. Answer the user queries in a Professional tone and style. Also respond in text only format, no  markup  format/ characters allowed.

Transcript:
{context}

Question:
{question}

Answer:
""")

# ✅ Format function to combine docs
def format_docs(docs: List[Any]) -> str:
    formatted_docs = []
    video=1
    for doc in docs:
        snippet = f"""
        video {video} transcript:
{doc.page_content}
        """
        formatted_docs.append(snippet.strip())
        video +=1
    return "\n\n---\n\n".join(formatted_docs)


# ✅ Build LCEL chain (input → retrieve → format → prompt → LLM → output)
def build_rag_chain(retriever,prompt_template):
    return (
        RunnableParallel({
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        })
        | prompt_template
        | llm
        | output_parser
    )

# ✅ Ask function — no class needed
def ask(question: str, video_id: str) -> str:
    
    try:
        retriever = store.as_retriever(search_kwargs={
            "k": 3,
            "filter": {"video_id": str(video_id)}
        })
    
        chain = build_rag_chain(retriever,prompt_template)

        # Run with timeout protection
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(chain.invoke, question)
            result = future.result(timeout=30)
        return {"answer": result}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json.dumps({"error": f"RAG pipeline error: {str(e)}"})

def ask_from_all_videos(question: str, user_id: str) -> str:
    """
    Perform a RAG query across all videos uploaded by a user.
    """
    try:
        # Step 1: Get user videos
        videos = get_videos_for_user(user_id)
        if not videos:
            return json.dumps({"error": "No videos found for this user."})
        
        video_ids = [str(video[0]) for video in videos]
    

        # Step 2: Create retriever with multi-video filter
        retriever = store.as_retriever(search_kwargs={
            "k": 5,  # Increase k for global search
            "filter": {"video_id": {"$in": video_ids}}
        })
        prompt_template=PromptTemplate.from_template("""
Act as a Social Media Expert, who uses the transcript as the context to answer the user queries, helping him in achiving his goals. Answer the user queries in a Professional tone and style. Also respond in text only format ,But no markdown format  response / characters allowed.
You will receive chunks from multiple videos, that will contain the video numbering which is added to just distiguish the chunks from one another.
Transcript:
{context}

Question:
{question}

Answer:
""")
        # Step 3: Build and run the RAG chain
        chain = build_rag_chain(retriever,prompt_template)
        # Timeout protection
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(chain.invoke, question)
            result = future.result(timeout=60)  # Slightly longer timeout for multi-video
        
        return {"answer": result}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json.dumps({"error": f"Cross-Video RAG error: {str(e)}"})    