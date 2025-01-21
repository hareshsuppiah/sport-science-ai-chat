import { Pinecone } from '@pinecone-database/pinecone';
import { QueryByVectorValues } from '@pinecone-database/pinecone';

export interface SearchResult {
  text: string;
  source: string;
  score: number;
}

export async function queryDocuments(query: string): Promise<SearchResult[]> {
  console.log("=== Starting Document Query Process ===");
  
  try {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return processMatches(data.matches || []);
  } catch (error) {
    console.error("=== Query Process Error ===", error);
    throw error;
  }
}

function processMatches(matches: any[]): SearchResult[] {
  return matches
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
}