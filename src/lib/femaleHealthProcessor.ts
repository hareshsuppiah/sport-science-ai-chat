import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

export async function queryFemaleAthleteDocuments(query: string) {
  try {
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
      modelName: "text-embedding-3-small"
    });

    // Get query embedding
    const queryEmbedding = await embeddings.embedQuery(query);

    // Initialize Pinecone
    const pc = new Pinecone({ 
      apiKey: import.meta.env.VITE_PINECONE_API_KEY
    });

    // Get Pinecone index
    const index = pc.index("female-athlete-index");

    // Query the index
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true
    });

    // Process and return results
    return queryResponse.matches?.map(match => ({
      text: match.metadata?.text || "",
      score: match.score || 0,
      source: match.metadata?.source || ""
    })) || [];

  } catch (error) {
    console.error('Error querying female athlete documents:', error);
    throw error;
  }
} 