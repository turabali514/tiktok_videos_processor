# rag_chain_pipeline.py
from langchain.chains import RetrievalQA
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from create_vector_db import get_vector_store

class RAGChainPipeline:
    def __init__(self):
        self.store = get_vector_store()
        self.retriever = self.store.as_retriever(search_kwargs={"k": 3})
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

        # Custom prompt template
        self.template = """
Act as a Social Media Expert, answering user questions based on the retrieved transcript of TikTok videos, providing helpful insights and helping the user achieve their goal.

Context:
{context}

Question:
{question}

Answer:
"""
        self.prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=self.template,
        )

        # Use the prompt in a QA chain (chain_type='stuff' is the default)
        self.qa_chain = load_qa_chain(self.llm, chain_type="stuff", prompt=self.prompt)

        # Wrap it into RetrievalQA
        self.chain = RetrievalQA(retriever=self.retriever, combine_documents_chain=self.qa_chain)

    def ask(self, question: str) -> str:
        result = self.chain.invoke({"query": question})
        return result["result"] if isinstance(result, dict) and "result" in result else str(result)
