from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain_core.documents import Document
import os
from utils.utils import get_settings, get_logger
from typing import Optional, Union

# Initialize settings and logger
settings = get_settings()
logger = get_logger(settings.LOGS_PATH)

db_path = settings.get("VECTOR_DB_PATH", "./db/tiktok_videos_processor_vector_db")
text_splitter = CharacterTextSplitter(
            chunk_size=settings.get("CHUNK_SIZE", 1000),
            chunk_overlap=settings.get("CHUNK_OVERLAP", 300)
        )
embedding_model = settings.get("EMBEDDING_MODEL", "text-embedding-3-small")
os.makedirs(db_path, exist_ok=True)
def get_vector_store( video_id: Optional[int] = None,as_retriever: bool = False) -> Union[Chroma, any]:
    """Get Chroma vector store instance"""
    try:
        embedding_fn = OpenAIEmbeddings(
                model=embedding_model,
                openai_api_key=settings.OPENAI_API_KEY
            )
            
        vectorstore = Chroma(
                persist_directory=db_path,
                embedding_function=embedding_fn
            )
            
        logger.debug(f"Vector store retrieved {'with retriever' if as_retriever else ''}")
        return vectorstore.as_retriever() if as_retriever else vectorstore
            
    except Exception as e:
            logger.error(f"Failed to get vector store: {str(e)}", exc_info=True)
            raise

def add_new_transcript(doc: str, video_id: int) -> bool:
        """Split and embed transcript with associated video_id"""
        try:
            logger.info(f"Processing transcript for video {video_id}")
            
            # Split document
            split_text = text_splitter.split_text(doc)
            logger.debug(f"Split transcript into {len(split_text)} chunks")
            
            # Create documents with metadata
            docs = [
                Document(
                    page_content=chunk, 
                    metadata={
                        "video_id": str(video_id),
                        "chunk_num": i,
                        "total_chunks": len(split_text)
                    }
                )
                for i, chunk in enumerate(split_text)
            ]
            
            # Add to vector store
            db_instance = get_vector_store()
            db_instance.add_documents(documents=docs)
            
            # Verify storage
            stored_count = len(db_instance.get()["documents"])
            logger.info(f"Successfully stored {len(docs)} chunks for video {video_id}. Total in DB: {stored_count}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to process transcript for video {video_id}: {str(e)}", exc_info=True)
            return False
