# rag_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from create_vector_db import get_vector_store
from typing import List, Any
import concurrent.futures

# ✅ Shared setup
store = get_vector_store()
llm = ChatOpenAI(model="gpt-4o-mini",temperature=0.5)
output_parser = StrOutputParser()

# ✅ Prompt Template
prompt_template = PromptTemplate.from_template("""
Act as a Social Media Expert, who uses the transcript as the context to answer the user queries, helping him in achiving his goals. Answer the user queries in a friendly way and light tone.

Transcript:
{context}

Question:
{question}

Answer:
""")

# ✅ Format function to combine docs
def format_docs(docs: List[Any]) -> str:
    return "\n\n".join(doc.page_content if hasattr(doc, "page_content") else str(doc) for doc in docs)

# ✅ Build LCEL chain (input → retrieve → format → prompt → LLM → output)
def build_rag_chain(retriever):
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
    
        chain = build_rag_chain(retriever)

        # Run with timeout protection
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(chain.invoke, question)
            result = future.result(timeout=30)
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json.dumps({"error": f"RAG pipeline error: {str(e)}"})

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) >= 3:
        video_id = sys.argv[1]
        question = " ".join(sys.argv[2:])
        answer = ask(question=question, video_id=video_id)
        if isinstance(answer, str) and answer.startswith("{"):
            print(answer)  
        else:
            print(json.dumps({"answer": answer}))
    else:
        print("Usage: python rag_chain.py <video_id> <question>")
