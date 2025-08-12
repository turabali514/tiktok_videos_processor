from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from create_vector_db import get_vector_store
from typing import List, Any
import concurrent.futures, json
from db import get_videos_for_user
from utils.utils import get_settings, get_logger

# Initialize settings and logger
settings = get_settings()
logger = get_logger(settings.LOGS_PATH)

# Shared setup
store = get_vector_store()
llm = ChatOpenAI(
    model=settings.OPENAI_MODEL or "gpt-4o-mini",
    temperature=settings.OPENAI_TEMPERATURE or 0.5,
    api_key=settings.OPENAI_API_KEY
)
output_parser = StrOutputParser()

logger.info("Initialized RAG chain components")

# Prompt Template
prompt_template = PromptTemplate.from_template("""
Act as a Social Media Expert, who uses the transcript as the only source to answer the user queries, helping him in achiving his goals. remmeber not to mention that you are using transcript. Answer the user queries in a Professional tone and style. Also respond in text only format, no  markup  format/ characters allowed.

Transcript:
{context}

Question:
{question}

Answer:
""")

# Format function to combine docs
def format_docs(docs: List[Any]) -> str:
    try:
        formatted_docs = []
        video = 1
        for doc in docs:
            snippet = f"""
            video {video} transcript:
{doc.page_content}
            """
            formatted_docs.append(snippet.strip())
            video += 1
        logger.debug(f"Formatted {len(docs)} document chunks")
        return "\n\n---\n\n".join(formatted_docs)
    except Exception as e:
        logger.error(f"Error formatting documents: {str(e)}")
        raise

# Build LCEL chain (input → retrieve → format → prompt → LLM → output)
def build_rag_chain(retriever, prompt_template):
    logger.debug("Building RAG chain")
    return (
        RunnableParallel({
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        })
        | prompt_template
        | llm
        | output_parser
    )

# Ask function — no class needed
def ask(question: str, video_id: str) -> str:
    try:
        logger.info(f"Starting RAG query for video {video_id}: {question[:50]}...")
        
        retriever = store.as_retriever(search_kwargs={
            "k": settings.RAG_K_VALUE or 3,
            "filter": {"video_id": str(video_id)}
        })
    
        chain = build_rag_chain(retriever, prompt_template)

        # Run with timeout protection
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(chain.invoke, question)
            result = future.result(timeout=settings.RAG_TIMEOUT or 30)
        
        logger.info(f"Successfully completed RAG query for video {video_id}")
        return {"answer": result}

    except concurrent.futures.TimeoutError:
        error_msg = f"RAG query timed out for video {video_id}"
        logger.error(error_msg)
        return {"error": error_msg}
    except Exception as e:
        logger.error(f"RAG pipeline error for video {video_id}: {str(e)}", exc_info=True)
        return {"error": f"RAG pipeline error: {str(e)}"}

def ask_from_all_videos(question: str, user_id: str) -> str:
    """
    Perform a RAG query across all videos uploaded by a user.
    """
    try:
        logger.info(f"Starting cross-video RAG query for user {user_id}: {question[:50]}...")
        
        # Step 1: Get user videos
        videos = get_videos_for_user(user_id)
        if not videos:
            logger.warning(f"No videos found for user {user_id}")
            return {"error": "No videos found for this user."}
        
        video_ids = [str(video["id"]) for video in videos]
        logger.debug(f"Found {len(video_ids)} videos for user {user_id}")

        # Step 2: Create retriever with multi-video filter
        retriever = store.as_retriever(search_kwargs={
            "k": settings.CROSS_RAG_K_VALUE or 5,  # Increase k for global search
            "filter": {"video_id": {"$in": video_ids}}
        })

        cross_prompt_template = PromptTemplate.from_template("""
Act as a Social Media Expert, who uses the transcript as the context to answer the user queries, helping him in achiving his goals. Answer the user queries in a Professional tone and style. Also respond in text only format ,But no markdown format  response / characters allowed.
You will receive chunks from multiple videos, that will contain the video numbering which is added to just distiguish the chunks frDom one another.

Transcript:
{context}

Question:
{question}

Answer:
""")
        # Step 3: Build and run the RAG chain
        chain = build_rag_chain(retriever, cross_prompt_template)
        
        # Timeout protection
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(chain.invoke, question)
            result = future.result(timeout=settings.CROSS_RAG_TIMEOUT or 60)
        
        logger.info(f"Successfully completed cross-video RAG query for user {user_id}")
        return {"answer": result}

    except concurrent.futures.TimeoutError:
        error_msg = f"Cross-video RAG query timed out for user {user_id}"
        logger.error(error_msg)
        return {"error": error_msg}
    except Exception as e:
        logger.error(f"Cross-Video RAG error for user {user_id}: {str(e)}", exc_info=True)
        return {"error": f"Cross-Video RAG error: {str(e)}"}