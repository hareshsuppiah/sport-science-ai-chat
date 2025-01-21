import { Pinecone } from '@pinecone-database/pinecone';

export interface SearchResult {
  text: string;
  source: string;
  score: number;
}

export async function queryDocuments(query: string): Promise<SearchResult[]> {
  console.log("=== Starting Document Query Process ===");
  console.log("Query:", query);
  
  try {
    // Initialize Pinecone
    console.log("Initializing Pinecone...");
    const pc = new Pinecone({
      apiKey: import.meta.env.VITE_PINECONE_API_KEY!
    });

    console.log("Creating index instance...");
    const index = pc.index(import.meta.env.VITE_PINECONE_INDEX!);

    // Get embedding
    console.log("Getting embedding for query:", query);
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
      const errorData = await embeddingResponse.json();
      console.error("OpenAI Embedding Error:", errorData);
      throw new Error(`Failed to get embedding: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const embeddingData = await embeddingResponse.json();
    console.log("Embedding Response:", {
      status: 'success',
      model: embeddingData.model,
      embeddingLength: embeddingData.data[0].embedding.length
    });

    const queryEmbedding = embeddingData.data[0].embedding;

    // Query the index
    console.log("Executing query...");
    const results = await index.namespace('research-papers').query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true
    });

    console.log("Query response:", {
      matches: results.matches?.length || 0,
      firstMatch: results.matches?.[0] ? {
        score: results.matches[0].score,
        metadata: results.matches[0].metadata
      } : null
    });

    return processMatches(results.matches || []);

    function processMatches(matches: any[]) {
      const relevantMatches = matches
        .filter(match => {
          const score = match.score ?? 0;
          const hasMetadata = !!match.metadata?.text;
          return score > 0.01 && hasMetadata;
        })
        .map(match => ({
          text: String(match.metadata?.text || ''),
          source: String(match.metadata?.filename || match.metadata?.source || ''),
          score: match.score ?? 0
        }));

      console.log("=== Query Process Results ===");
      console.log(`Found ${relevantMatches.length} relevant matches`);
      if (relevantMatches.length > 0) {
        console.log("Sample match:", {
          score: relevantMatches[0].score,
          textPreview: relevantMatches[0].text.substring(0, 100),
          source: relevantMatches[0].source
        });
      }
      
      return relevantMatches;
    }

  } catch (error) {
    console.error("=== Query Process Error ===");
    const err = error as Error;
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    throw error;
  }
}