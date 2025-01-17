import os
from dotenv import load_dotenv
import openai
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings

# Load environment variables
load_dotenv(override=True)

def get_embedding(text: str, api_key: str) -> list:
    """Get embedding from OpenAI API."""
    client = openai.OpenAI(api_key=api_key)
    return client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    ).data[0].embedding

def get_chatbot_response(query: str, context: str, api_key: str) -> str:
    """Generate a chatbot response using OpenAI."""
    client = openai.OpenAI(api_key=api_key)
    
    system_prompt = """You are a sports science expert analyzing research papers. 
    Use ONLY the provided research context to answer the question.
    Be specific about methodology, results, and conclusions from the paper.
    If the context contains partial information, share what's available and indicate what's missing.
    If the context doesn't contain relevant information, say so."""
    
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query}"}
        ],
        temperature=0.3,  # Lower temperature for more focused responses
        max_tokens=1000   # Increased for more detailed responses
    )
    
    return response.choices[0].message.content

def test_query(query_text: str, namespace: str = "research-papers"):
    """Test a specific query."""
    try:
        print(f"\nQuery: '{query_text}'")
        
        # Initialize Pinecone
        pc = Pinecone(
            api_key=os.getenv('VITE_PINECONE_API_KEY'),
            environment=os.getenv('VITE_PINECONE_ENVIRONMENT')
        )
        
        # Get the index
        index = pc.Index(os.getenv('VITE_PINECONE_INDEX'))
        
        # Generate embedding
        query_embedding = get_embedding(query_text, os.getenv('VITE_OPENAI_API_KEY'))
        
        # Query with higher top_k and include all metadata
        response = index.query(
            vector=query_embedding,
            top_k=20,  # Increased to get more context
            include_metadata=True,
            namespace=namespace,
            filter={
                "filename": {"$eq": "1736171_Boukhris,O_2024.pdf"}  # Filter for specific paper
            }
        )
        
        # Debug info
        print(f"\nFound {len(response.matches)} matches with scores:")
        for match in response.matches:
            print(f"Score: {match.score:.4f} - Text starts with: {match.metadata.get('text', '')[:100]}...")
        
        # Combine relevant text from matches with higher threshold
        context = "\n".join([
            match.metadata.get('text', '') 
            for match in response.matches 
            if match.score > 0.01  # Adjusted threshold
        ])
        
        print(f"\nTotal context length: {len(context)} characters")
        
        # Get chatbot response
        if context:
            answer = get_chatbot_response(query_text, context, os.getenv('VITE_OPENAI_API_KEY'))
            print("\nAnswer:", answer)
            
            print("\nSources:")
            for i, match in enumerate(response.matches[:5], 1):  # Show top 5 sources
                if match.score > 0.01:
                    print(f"{i}. Score: {match.score:.4f}")
        else:
            print("\nNo relevant information found in the database.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_queries = [
        "Can you provide a summary of the main findings of this study?",
        "What is non-sleep deep rest (NSDR) and what were its effects in this study?"
    ]
    
    for query in test_queries:
        test_query(query)