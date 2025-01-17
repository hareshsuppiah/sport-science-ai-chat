import { Pinecone } from '@pinecone-database/pinecone';

export const initPinecone = async () => {
  const apiKey = import.meta.env.VITE_PINECONE_API_KEY;

  if (!apiKey) {
    console.error('Pinecone API key is missing in environment variables');
    throw new Error('Pinecone API key is missing');
  }

  try {
    console.log('Initializing Pinecone...');
    // Only pass the required apiKey parameter
    const pc = new Pinecone({ apiKey });

    // Test the connection
    const indexes = await pc.listIndexes();
    console.log('Successfully connected to Pinecone. Available indexes:', indexes);

    return pc;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed Pinecone initialization error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}