import os
from dotenv import load_dotenv
import openai
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import PyPDF2

# Load environment variables
load_dotenv()

def read_pdf(file_path):
    """Read PDF and return text content."""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text

def chunk_text(text):
    """Split text into overlapping chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    return text_splitter.split_text(text)

def get_embeddings(chunks):
    """Get embeddings for chunks using OpenAI."""
    embeddings = OpenAIEmbeddings(
        api_key=os.getenv('VITE_OPENAI_API_KEY'),
        model="text-embedding-3-small"
    )
    return [embeddings.embed_query(chunk) for chunk in chunks]

def index_document(file_path):
    """Index document in Pinecone."""
    # Initialize Pinecone
    pc = Pinecone(
        api_key=os.getenv('VITE_PINECONE_API_KEY'),
        environment=os.getenv('VITE_PINECONE_ENVIRONMENT')
    )
    
    # Get index
    index = pc.Index(os.getenv('VITE_PINECONE_INDEX'))
    
    # Read and chunk document
    print("Reading document...")
    text = read_pdf(file_path)
    print("Chunking text...")
    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks")
    
    # Get embeddings
    print("Generating embeddings...")
    vectors = []
    for i, chunk in enumerate(chunks):
        embedding = get_embeddings([chunk])[0]
        vectors.append({
            'id': f"chunk_{i}",
            'values': embedding,
            'metadata': {
                'text': chunk,
                'chunk_index': i,
                'filename': os.path.basename(file_path),
                'source': os.path.basename(file_path)
            }
        })
        print(f"Processed chunk {i+1}/{len(chunks)}")
    
    # Upsert to Pinecone
    print("Upserting to Pinecone...")
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace="research-papers")
        print(f"Upserted batch {i//batch_size + 1}/{(len(vectors)-1)//batch_size + 1}")

if __name__ == "__main__":
    file_path = "1736171_Boukhris,O_2024.pdf"  # Update with your PDF path
    index_document(file_path) 