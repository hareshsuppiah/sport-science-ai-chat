import os
from dotenv import load_dotenv

load_dotenv()

print("Environment variables:")
print(f"PINECONE_API_KEY: {os.getenv('VITE_PINECONE_API_KEY')}")
print(f"PINECONE_ENV: {os.getenv('VITE_PINECONE_ENVIRONMENT')}")
print(f"PINECONE_INDEX: {os.getenv('VITE_PINECONE_INDEX')}") 