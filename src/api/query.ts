import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: process.env.VITE_PINECONE_API_KEY!
    });

    const index = pc.index(process.env.VITE_PINECONE_INDEX!);

    // Get embedding from OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query
      })
    });

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Query Pinecone
    const results = await index.namespace('research-papers').query({
      vector: queryEmbedding,
      topK: 20,
      includeMetadata: true,
      filter: {
        filename: { $eq: "1736171_Boukhris,O_2024.pdf" }
      }
    });

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Query error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process query' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 