from pinecone import Pinecone
import os
from dotenv import load_dotenv

# Load and verify environment variables
load_dotenv()
api_key = os.getenv('VITE_PINECONE_API_KEY')
environment = os.getenv('VITE_PINECONE_ENVIRONMENT')
index_name = os.getenv('VITE_PINECONE_INDEX')

print(f"Initializing Pinecone with:")
print(f"Environment: {environment}")
print(f"Index name: {index_name}")
print(f"API key: {api_key[:10]}...")

try:
    # Initialize Pinecone
    pc = Pinecone(
        api_key=api_key,
        environment=environment
    )
    
    # Get index
    print("\nGetting index...")
    index = pc.Index(index_name)
    
    # Delete vectors
    print("\nDeleting vectors...")
    index.delete(delete_all=True, namespace="research-papers")
    print("Successfully deleted all vectors from the index")
    
except Exception as e:
    print(f"\nError occurred:")
    print(f"Type: {type(e)}")
    print(f"Message: {str(e)}") 