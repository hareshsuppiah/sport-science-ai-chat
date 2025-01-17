import { Pinecone } from '@pinecone-database/pinecone';
import { QueryByVectorValues } from '@pinecone-database/pinecone';

export interface SearchResult {
  text: string;
  source: string;
  score: number;
}

export async function queryDocuments(query: string): Promise<SearchResult[]> {
  console.log("=== Starting Document Query Process ===");
  console.log("Query:", query);
  
  try {
    // Log environment variables (safely)
    console.log("Environment Check:", {
      hasPineconeKey: !!import.meta.env.VITE_PINECONE_API_KEY,
      hasPineconeIndex: !!import.meta.env.VITE_PINECONE_INDEX,
      hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      pineconeIndex: import.meta.env.VITE_PINECONE_INDEX
    });

    // Initialize Pinecone
    console.log("Initializing Pinecone...");
    const pc = new Pinecone({
      apiKey: import.meta.env.VITE_PINECONE_API_KEY!
    });

    console.log("Creating index instance...");
    const index = pc.index(import.meta.env.VITE_PINECONE_INDEX!);

    // Get and log index stats
    console.log("Fetching index stats...");
    const stats = await index.describeIndexStats();
    console.log("Index Stats:", {
      dimension: stats.dimension,
      namespaces: stats.namespaces,
      totalRecordCount: stats.totalRecordCount,
      indexFullness: stats.indexFullness
    });
    
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

    // Validate embedding
    console.log("Validating embedding...");
    if (!Array.isArray(queryEmbedding)) {
      throw new Error("Query embedding is not an array");
    }
    if (queryEmbedding.length !== stats.dimension) {
      throw new Error(`Embedding dimension mismatch: got ${queryEmbedding.length}, expected ${stats.dimension}`);
    }
    if (!queryEmbedding.every(n => typeof n === 'number')) {
      throw new Error("Query embedding contains non-numeric values");
    }
    console.log("Embedding validation passed");

    // Log namespace details and validate data presence
    const namespaceDetails = stats.namespaces || {};
    console.log("Detailed namespace stats:", {
      availableNamespaces: Object.keys(namespaceDetails),
      vectorCounts: Object.entries(namespaceDetails).map(([ns, details]) => ({
        namespace: ns || 'default',
        vectorCount: details.recordCount
      }))
    });

    // Simple query according to Pinecone docs
    console.log("Executing query with validated parameters:", {
      vectorLength: queryEmbedding.length,
      topK: 20,
      namespace: "research-papers",
      filter: {
        filename: "1736171_Boukhris,O_2024.pdf"
      }
    });
    try {
      const results = await index.namespace('research-papers').query({
        vector: queryEmbedding,
        topK: 20,
        includeMetadata: true,
        filter: {
          filename: { $eq: "1736171_Boukhris,O_2024.pdf" }
        }
      });

      console.log("Query response:", {
        matches: results.matches?.length || 0,
        firstMatch: results.matches?.[0] ? {
          score: results.matches[0].score,
          metadata: results.matches[0].metadata
        } : null
      });

      return processMatches(results.matches || []);
    } catch (error) {
      console.error("Query error:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }

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
  } catch (error: unknown) {
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