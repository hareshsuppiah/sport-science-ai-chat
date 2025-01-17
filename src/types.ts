export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface SearchResult {
  text: string;
  source: string;
  score: number;
} 