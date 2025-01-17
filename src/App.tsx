import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ConsentBanner } from './components/ConsentBanner';
import { supabase } from './lib/supabase';
import { queryDocuments } from './lib/documentProcessor';
import type { Message } from './types';

const systemPrompt = `You are a sports science expert analyzing research papers. 
Use ONLY the provided research context to answer the question.
Be specific about methodology, results, and conclusions from the paper.
If the context contains partial information, share what's available and indicate what's missing.
If the context doesn't contain relevant information, say so.`;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('=== Starting Chat Process ===');
      console.log('User query:', input);
      
      const searchResults = await queryDocuments(input);
      console.log('Search results summary:', {
        count: searchResults.length,
        scores: searchResults.map(r => r.score)
      });
      
      const context = searchResults
        .map(result => result.text)
        .join('\n\n');

      console.log('Context preparation:', {
        length: context.length,
        hasContent: !!context
      });

      if (!context) {
        console.log('No context found, stopping process');
        setError('No relevant information found in the database.');
        setIsLoading(false);
        return;
      }

      console.log('Preparing OpenAI request with system prompt:', systemPrompt);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `Context: ${context}\n\nQuestion: ${input}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData?.error?.message || 'Failed to get response from OpenAI');
      }

      const data = await response.json();
      console.log('OpenAI response:', {
        status: 'success',
        model: data.model,
        content: data.choices[0].message.content
      });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
        sources: searchResults.map(result => result.source)
      };

      console.log('=== Chat Process Complete ===');
      
      console.log('Logging chat to Supabase...');
      try {
        const sourcesArray = `{${searchResults.map(r => `"${r.source}"`).join(',')}}`;
        
        const { error } = await supabase
          .from('chat_logs')
          .insert({
            query: input,
            response: assistantMessage.content,
            sources: sourcesArray,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to log chat to Supabase:', error);
        } else {
          console.log('Successfully logged chat to Supabase');
        }
      } catch (error) {
        console.error('Failed to log chat to Supabase:', error);
      }
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error: unknown) {
      console.error('=== Chat Process Error ===');
      const err = error as Error;
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 container mx-auto max-w-4xl p-4">
        <ConsentBanner />
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the research..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;