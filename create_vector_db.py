from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain_core.documents import Document
import os

db_path = "./db/tiktok_videos_processor_vector_db"
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=300)

# Get full DB instance
def get_vector_store(video_id: int = None, embedding_fn=None, as_retriever: bool = False):
    os.makedirs(db_path, exist_ok=True)

    if embedding_fn is None:
        embedding_fn = OpenAIEmbeddings(model="text-embedding-3-small")

    vectorstore = Chroma(
        persist_directory=db_path,
        embedding_function=embedding_fn
    )
    
    return vectorstore 


def add_new_transcript(doc: str, video_id: int):
    """Split and embed transcript with associated video_id."""
    split_text = text_splitter.split_text(doc)
    docs = [
        Document(page_content=chunk, metadata={"video_id": str(video_id)})
        for chunk in split_text
    ]
    db_instance = get_vector_store()
    db_instance.add_documents(documents=docs)
    for d in docs[:2]:
        print(d.metadata)   
    db_instance = get_vector_store()
    stored = db_instance.get()["documents"]
