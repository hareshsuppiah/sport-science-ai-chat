import os
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
import openai

def load_environment():
    """Load environment variables and validate them."""
    load_dotenv()
    
    required_vars = [
        'VITE_PINECONE_API_KEY',
        'VITE_OPENAI_API_KEY',
        'VITE_PINECONE_INDEX'
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    return {
        'pinecone_api_key': os.getenv('VITE_PINECONE_API_KEY'),
        'openai_api_key': os.getenv('VITE_OPENAI_API_KEY'),
        'index_name': os.getenv('VITE_PINECONE_INDEX')
    }

def get_embedding(text: str, api_key: str) -> list:
    """Get embedding from OpenAI API."""
    client = openai.OpenAI(api_key=api_key)
    
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    
    return response.data[0].embedding

def test_pinecone_connection():
    """Test basic Pinecone operations."""
    try:
        # Load environment variables
        print("Loading environment variables...")
        env = load_environment()
        
        # Initialize Pinecone
        print("\nInitializing Pinecone...")
        pc = Pinecone(api_key=env['pinecone_api_key'])
        
        # List indexes
        print("\nListing available indexes...")
        indexes = pc.list_indexes()
        print(f"Available indexes: {indexes}")
        
        # Get the specific index
        print(f"\nAccessing index: {env['index_name']}")
        index = pc.Index(env['index_name'])
        
        # Test query
        test_query = "What are the key factors affecting athletic performance?"
        print(f"\nGenerating embedding for test query: '{test_query}'")
        query_embedding = get_embedding(test_query, env['openai_api_key'])
        
        print("\nQuerying Pinecone...")
        query_response = index.query(
            vector=query_embedding,
            top_k=3,
            include_metadata=True,
            namespace="research-papers"
        )
        
        print("\nQuery Results:")
        for i, match in enumerate(query_response.matches, 1):
            print(f"\nMatch {i}:")
            print(f"Score: {match.score}")
            print(f"Metadata: {match.metadata}")
            
        return True
        
    except Exception as e:
        print(f"\nError occurred: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("Starting Pinecone test script...")
    success = test_pinecone_connection()
    print("\nTest completed successfully!" if success else "\nTest failed!")