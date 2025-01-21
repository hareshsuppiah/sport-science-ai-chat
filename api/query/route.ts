/// <reference types="vite/client" />
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(request: Request) {
  try {
    console.log("=== API Route Started ===");
    console.log("Request URL:", request.url);
    console.log("Request method:", request.method);
    
    // Parse request body
    let query: string;
    try {
      const body = await request.json();
      query = body.query;
      console.log("Query received:", query);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(JSON.stringify({
        error: 'Failed to parse request body',
        details: e instanceof Error ? e.message : String(e)
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // Check environment variables
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.error("OpenAI API key missing");
      return new Response(JSON.stringify({
        error: 'OpenAI API key is missing'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    if (!import.meta.env.VITE_PINECONE_API_KEY || !import.meta.env.VITE_PINECONE_INDEX) {
      console.error("Pinecone configuration missing");
      return new Response(JSON.stringify({
        error: 'Pinecone configuration is missing'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // Get embedding from OpenAI
    console.log("Requesting embedding from OpenAI...");
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-ada-002',
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("OpenAI API Error:", {
        status: embeddingResponse.status,
        statusText: embeddingResponse.statusText,
        error: errorText,
      });
      return new Response(JSON.stringify({
        error: `OpenAI API error: ${embeddingResponse.statusText}`,
        details: errorText
      }), {
        status: embeddingResponse.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    const embeddingData = await embeddingResponse.json();
    console.log("Embedding received from OpenAI");

    // Initialize Pinecone
    console.log("Initializing Pinecone...");
    const pinecone = new Pinecone({
      apiKey: import.meta.env.VITE_PINECONE_API_KEY!
    });

    const index = pinecone.index(import.meta.env.VITE_PINECONE_INDEX!);
    console.log("Pinecone initialized");

    // Query Pinecone
    const queryEmbedding = embeddingData.data[0].embedding;
    console.log("Querying Pinecone...");

    const results = await index.namespace('research-papers').query({
      vector: queryEmbedding,
      topK: 20,
      includeMetadata: true
    });

    console.log("Pinecone query results:", {
      matchCount: results.matches?.length || 0,
      hasMatches: !!results.matches?.length,
      firstMatchScore: results.matches?.[0]?.score
    });

    return new Response(JSON.stringify({ matches: results.matches }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('API Error:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.name : 'UnknownError',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
} 