export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface ChatLog {
  id: string;
  query: string;
  response: string;
  sources: string[];
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      chat_logs: {
        Row: ChatLog;
        Insert: Omit<ChatLog, 'id' | 'created_at'>;
      };
    };
  };
}

export interface SearchResult {
  text: string;
  source: string;
  score: number;
}