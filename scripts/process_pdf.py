import os
import sys
import json
import time
from typing import List, Dict
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from pinecone import Pinecone
from dotenv import load_dotenv

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file."""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
    return text.strip()

def process_pdf(pdf_path: str, openai_key: str, pinecone_key: str, pinecone_env: str, index_name: str) -> Dict:
    """Process a PDF file and upload its embeddings to Pinecone."""
    try:
        # Extract text from PDF
        print(f"\nProcessing: {pdf_path}")
        text = extract_text_from_pdf(pdf_path)
        
        if not text:
            raise ValueError(f"No text content found in PDF: {pdf_path}")
        
        # Split text into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        
        docs = splitter.create_documents(
            [text],
            metadatas=[{
                'source': os.path.basename(pdf_path),
                'filename': os.path.basename(pdf_path)
            }]
        )
        
        print(f"Created {len(docs)} document chunks")
        
        # Initialize OpenAI embeddings
        embeddings = OpenAIEmbeddings(
            openai_api_key=openai_key,
            model="text-embedding-ada-002"
        )
        
        # Initialize Pinecone
        pc = Pinecone(api_key=pinecone_key)
        index = pc.Index(index_name)
        
        # Process chunks and upload to Pinecone
        processed_chunks = 0
        failed_chunks = 0
        batch_size = 50  # Process in smaller batches
        
        for i in range(0, len(docs), batch_size):
            batch = docs[i:i + batch_size]
            vectors = []
            
            for j, doc in enumerate(batch):
                try:
                    # Clean and truncate text
                    clean_text = ' '.join(doc.page_content.split())[:8000]
                    
                    # Generate embedding
                    embedding = embeddings.embed_documents([clean_text])[0]
                    
                    # Create vector ID
                    vector_id = f"{os.path.basename(pdf_path)}-{i+j}-{int(time.time())}"[:512]
                    
                    vectors.append({
                        'id': vector_id,
                        'values': embedding,
                        'metadata': {
                            'text': clean_text,
                            'source': doc.metadata['source'],
                            'filename': doc.metadata['filename'],
                            'chunk_index': i+j
                        }
                    })
                    
                    processed_chunks += 1
                    print(f"Processed chunk {i+j+1}/{len(docs)}")
                    
                except Exception as e:
                    print(f"Error processing chunk {i+j}: {str(e)}")
                    failed_chunks += 1
            
            # Upsert batch to Pinecone
            if vectors:
                try:
                    index.upsert(
                        vectors=vectors,
                        namespace='research-papers'
                    )
                    print(f"Uploaded batch of {len(vectors)} vectors")
                except Exception as e:
                    print(f"Error uploading batch: {str(e)}")
                    failed_chunks += len(vectors)
            
            # Add delay between batches
            if i + batch_size < len(docs):
                time.sleep(2)
        
        summary = {
            'filename': os.path.basename(pdf_path),
            'processed_chunks': processed_chunks,
            'failed_chunks': failed_chunks,
            'total_chunks': len(docs)
        }
        
        print(json.dumps(summary, indent=2))
        return summary
        
    except Exception as e:
        print(f"Error processing document: {str(e)}")
        raise

def process_pdf_folder(folder_path: str, openai_key: str, pinecone_key: str, pinecone_env: str, index_name: str) -> List[Dict]:
    """Process all PDF files in a folder."""
    if not os.path.exists(folder_path):
        raise ValueError(f"Folder not found: {folder_path}")
    
    results = []
    pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print(f"No PDF files found in {folder_path}")
        return results
    
    print(f"Found {len(pdf_files)} PDF files")
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(folder_path, pdf_file)
        try:
            result = process_pdf(pdf_path, openai_key, pinecone_key, pinecone_env, index_name)
            results.append(result)
            # Add delay between files
            time.sleep(5)
        except Exception as e:
            print(f"Failed to process {pdf_file}: {str(e)}")
            results.append({
                'filename': pdf_file,
                'error': str(e)
            })
    
    return results

def main():
    # Load environment variables
    load_dotenv()
    
    # Get configuration from environment
    openai_key = os.getenv('VITE_OPENAI_API_KEY')
    pinecone_key = os.getenv('VITE_PINECONE_API_KEY')
    pinecone_env = os.getenv('VITE_PINECONE_ENVIRONMENT')
    index_name = os.getenv('VITE_PINECONE_INDEX')
    
    # Validate environment variables
    missing_vars = []
    for var_name, var_value in [
        ('VITE_OPENAI_API_KEY', openai_key),
        ('VITE_PINECONE_API_KEY', pinecone_key),
        ('VITE_PINECONE_ENVIRONMENT', pinecone_env),
        ('VITE_PINECONE_INDEX', index_name)
    ]:
        if not var_value:
            missing_vars.append(var_name)
    
    if missing_vars:
        print("Missing required environment variables:", ', '.join(missing_vars))
        sys.exit(1)
    
    # Process all PDFs in the pdfs folder
    pdfs_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'pdfs')
    
    try:
        results = process_pdf_folder(pdfs_folder, openai_key, pinecone_key, pinecone_env, index_name)
        print("\nProcessing Summary:")
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(f"Failed to process PDFs: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()