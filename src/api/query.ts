import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(request: Request) {
  try {
    console.log("=== API Route Started ===");
    const { query } = await request.json();
    console.log("Query received:", query);

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }

    if (!import.meta.env.VITE_PINECONE_API_KEY) {
      throw new Error('Pinecone API key is missing');
    }

    // Initialize Pinecone
    console.log("Initializing Pinecone...");
    const pc = new Pinecone({
      apiKey: import.meta.env.VITE_PINECONE_API_KEY,
    });
    console.log("Pinecone initialized");

    const index = pc.index("sportsciencechatbot");
    console.log("Pinecone index accessed");

    // Get embedding from OpenAI
    console.log("Requesting embedding from OpenAI...");
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query
      })
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText} - ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    console.log("Embedding received from OpenAI");

    const queryEmbedding = embeddingData.data[0].embedding;

    // Query Pinecone
    console.log("Querying Pinecone...");
    const results = await index.query({
      vector: queryEmbedding,
      topK: 20,
      includeMetadata: true,
      filter: {
        filename: { $eq: "1736171_Boukhris,O_2024.pdf" }
      }
    });
    console.log("Pinecone query completed");

    return new Response(JSON.stringify({ matches: results.matches }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Query error:', error);
    const errorResponse = {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.name : 'UnknownError'
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 