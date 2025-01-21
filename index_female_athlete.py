import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# Verify API key is loaded
if not os.getenv("VITE_OPENAI_API_KEY"):
    raise ValueError("VITE_OPENAI_API_KEY not found in environment variables")

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("VITE_OPENAI_API_KEY")
)

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("VITE_PINECONE_API_KEY"))
index = pc.Index("female-athlete-index")

# Directory containing PDFs
pdf_directory = "female-athlete-research"

# Ensure directory exists
if not os.path.exists(pdf_directory):
    os.makedirs(pdf_directory)
    print(f"Created directory: {pdf_directory}")

# Process each PDF in the directory
for filename in os.listdir(pdf_directory):
    if filename.endswith(".pdf"):
        pdf_path = os.path.join(pdf_directory, filename)
        print(f"Processing {filename}...")
        
        # Load and split the PDF
        loader = PyPDFLoader(pdf_path)
        pages = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        chunks = text_splitter.split_documents(pages)
        print(f"Split {filename} into {len(chunks)} chunks")
        
        # Create vectors for each chunk
        for i, chunk in enumerate(chunks):
            try:
                # Create embedding
                embedding = embeddings.embed_query(chunk.page_content)
                
                # Create unique ID for this chunk
                chunk_id = f"{filename}-chunk-{i}"
                
                # Prepare metadata
                metadata = {
                    "source": filename,
                    "page": chunk.metadata.get("page", 0),
                    "text": chunk.page_content
                }
                
                # Upsert to Pinecone
                index.upsert(vectors=[{
                    "id": chunk_id,
                    "values": embedding,
                    "metadata": metadata
                }])
                
                print(f"Uploaded chunk {i+1}/{len(chunks)} from {filename}")
                
            except Exception as e:
                print(f"Error processing chunk {i} from {filename}: {str(e)}")
                continue

print("Indexing complete!") 