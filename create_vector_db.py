from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain_core.documents import Document
import os
db_path= "./db/tiktok_videos_processor_vector_bd"
db=None
text_splitter=CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=300
)
def get_vector_store():
    """Initialize Chroma vector store only once per app run."""
    global db
    if db is None:
        os.makedirs(db_path, exist_ok=True)
        db = Chroma(
            persist_directory=db_path,
            embedding_function=OpenAIEmbeddings()
        )
    return db
def add_new_transcript(doc):
    split_text= text_splitter.split_text(doc)
    docs = [Document(page_content=chunk) for chunk in split_text]
    db_instance = get_vector_store()
    print (docs)
    db_instance.add_documents(documents=docs)
    return  