import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, ExternalLink, Maximize2, Minimize2, Text, CheckCheck, ArrowDownWideNarrow, FileText } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { supabase } from './lib/supabase';
import { queryDocuments } from './lib/documentProcessor';
import { LoadingDots } from './components/LoadingDots';
import { AIInputWithSuggestions } from './components/AIInputWithSuggestions';
import { cn } from './lib/utils';
import type { Message } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { DemographicCollector } from './components/DemographicCollector';
import { querySportScientistDocuments } from './lib/sportScientistProcessor';
import { getMemoryForStudy } from './lib/conversationMemory';
import { queryFemaleAthleteDocuments } from './lib/femaleHealthProcessor';

const systemPrompt = `You are a sports science expert sharing insights from research studies.
Use ONLY the provided context to share findings in a clear, concise, and practical way for athletes, coaches, sport scientists, or researchers.

Format your responses using these guidelines:
• Use short sentences and structure responses with small paragraphs for readability
• Highlight key takeaways and practical implications, keeping explanations concise
• If the context is incomplete, share what is available and note what's missing in simple terms
• If the context does not answer the user's question, state this politely and encourage further exploration
• Conclude with a friendly, open-ended question that invites curiosity`;

const sportScientistPrompt = `You are a friendly, approachable sport scientist - think of yourself as the Ali Abdaal of sport science. 
Your goal is to make complex sport science super simple and actionable.

Keep your responses:
• Short and sweet (1-2 paragraphs max; 1 succinct para is better than 2 or longer rambling points)
• Crystal clear (like explaining to a friend)
• Super practical (focus on the "how")



Remember: No jargon, no fluff - just clear, actionable advice that anyone can understand and use today.`;

const RESEARCH_PROMPTS = [
  // Understanding the Study
  "What are the key findings of this research?",
  "What problem or question does this study aim to solve?",
  "What is the significance of the results presented in this study?",
  // Exploring Methodology
  "What methods or approaches were used in this research?",
  "How were the results measured or evaluated in this study?",
  "What makes the methodology unique or important?",
  // Delving into Results
  "What do the results mean in the context of the study's aims?",
  "Are there any surprising or unexpected findings in the study?",
  "What trends or patterns were observed in the results?",
  // Examining Implications
  "How can the findings from this study be interpreted within its field?",
  "What practical applications do the results suggest?",
  "What are the main takeaways for practitioners or researchers?",
  // Addressing Study Limitations
  "What limitations are acknowledged in this research?",
  "What might have influenced the results or findings of this study?",
  "How could the study design be improved in future work?",
  // Clarifying Concepts
  "What key concepts or terms are important to understanding this paper?",
  "What are the main theoretical frameworks or models used?",
  "How does this research expand on or refine previous work in this area?",
  // Engaging with Context
  "What motivated the authors to pursue this research?",
  "What questions are raised by the findings of this paper?",
  "How do the findings relate to the study's stated goals?",
  // Exploring Results in Depth
  "Which factors were most significant in determining the results?",
  "How do the findings compare across different groups or variables in the study?",
  "What do the results suggest about the assumptions made in the study?",
  // Future-Oriented Within Context
  "What follow-up studies could build directly on this research?",
  "What questions remain unanswered by this study?",
  "What additional data might strengthen the conclusions of this paper?",
  // Practical Understanding
  "How might someone apply these findings in their work or research?",
  "What examples help illustrate the main findings of this paper?",
  "What are the practical challenges in implementing the findings of this study?"
];

const SLEEP_SCIENTIST_PROMPTS = [
  // Sleep Optimization
  "How can I optimize my sleep environment for better recovery?",
  "What's the ideal pre-sleep routine for athletes?",
  "How much sleep do athletes really need?",
  // Recovery Strategies
  "What's the best time to take naps during training days?",
  "How can I improve sleep quality during competition periods?",
  "What are the best recovery techniques to complement good sleep?",
  // Problem Solving
  "How do I manage jet lag during international competitions?",
  "What should I do when I can't fall asleep before a big event?",
  "How can I reset my sleep schedule after traveling?"
];

const FEMALE_HEALTH_PROMPTS = [
  // Performance & Hormones
  "How does the menstrual cycle affect training and performance?",
  "What are the best nutrition strategies across the menstrual cycle?",
  "How should I adjust training intensity throughout my cycle?",
  // Health Management
  "What are signs of RED-S I should watch out for?",
  "How can I maintain bone health as a female athlete?",
  "What should I know about iron deficiency in female sports?",
  // Recovery & Wellness
  "How can I manage premenstrual symptoms during training?",
  "What are the best recovery strategies for female athletes?",
  "How can I optimize my energy levels throughout my cycle?"
];

const STRENGTH_COACH_PROMPTS = [
  // Program Design
  "How should I structure a periodized training program?",
  "What's the optimal balance between strength and conditioning?",
  "How can I prevent plateaus in strength gains?",
  // Performance
  "What are the best exercises for power development?",
  "How can I improve explosive strength for sports?",
  "What's the right balance of volume and intensity?",
  // Recovery & Prevention
  "How do I program deload weeks effectively?",
  "What are the best ways to prevent training injuries?",
  "How should I adjust training load during competition season?"
];

function getRandomPrompts(count: number, activeTab: string) {
  let promptList;
  switch (activeTab) {
    case 'study-1':
      promptList = RESEARCH_PROMPTS;
      break;
    case 'sleep-scientist':
      promptList = SLEEP_SCIENTIST_PROMPTS;
      break;
    case 'female-health':
      promptList = FEMALE_HEALTH_PROMPTS;
      break;
    case 'strength-coach':
      promptList = STRENGTH_COACH_PROMPTS;
      break;
    default:
      promptList = RESEARCH_PROMPTS;
  }
  const shuffled = [...promptList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const CUSTOM_ACTIONS = [
  {
    text: "Summarize",
    icon: Text,
    colors: {
      icon: "text-blue-600",
      border: "border-blue-500",
      bg: "bg-blue-100",
    },
  },
  {
    text: "Explain",
    icon: CheckCheck,
    colors: {
      icon: "text-green-600",
      border: "border-green-500",
      bg: "bg-green-100",
    },
  },
  {
    text: "Key Points",
    icon: ArrowDownWideNarrow,
    colors: {
      icon: "text-purple-600",
      border: "border-purple-500",
      bg: "bg-purple-100",
    },
  },
];

type PanelState = 'minimized' | 'normal' | 'expanded';

interface PanelStates {
  pdf: PanelState;
  chat: PanelState;
}

function App() {
  const [studyMessages, setStudyMessages] = useState<{ [key: string]: Message[] }>({
    'study-1': [],
    'sleep-scientist': [],
    'female-health': [],
    'strength-coach': []
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelStates, setPanelStates] = useState<PanelStates>({
    pdf: 'normal',
    chat: 'normal'
  });
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeStudy, setActiveStudy] = useState("study-1");
  const [showDemographics, setShowDemographics] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('research_session_id');
    const savedUserAgent = localStorage.getItem('user_agent');
    const currentUserAgent = navigator.userAgent;

    if (savedSession && savedUserAgent === currentUserAgent) {
      // We have a valid session, don't show demographics
      setSessionId(savedSession);
      setShowDemographics(false);
      
      // Load saved demographics for verification
      const savedDemographics = localStorage.getItem('user_demographics');
      if (savedDemographics) {
        console.log('Found saved demographics:', JSON.parse(savedDemographics));
      }
    } else {
      // New session or different browser
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setShowDemographics(true);
    }
  }, []);

  // Update prompts when tab changes
  useEffect(() => {
    setExamplePrompts(getRandomPrompts(4, activeStudy));
  }, [activeStudy]);

  const handleDemographicComplete = async (demographics: any) => {
    console.log('Demographics submitted:', demographics);
    
    try {
      // First create a session in Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_agent: navigator.userAgent,
          user_type: demographics.userType,
          age_range: demographics.ageRange,
          experience_level: demographics.experienceLevel,
          primary_sport: demographics.primarySport,
          consent_given: demographics.consentGiven
        })
        .select('session_id')
        .single();

      if (sessionError) throw sessionError;

      // Save session ID to state and localStorage
      setSessionId(sessionData.session_id);
      localStorage.setItem('research_session_id', sessionData.session_id);
      localStorage.setItem('user_agent', navigator.userAgent);
      
      setShowDemographics(false);
      
      // Add welcome message
      setStudyMessages(prev => ({
        ...prev,
        [activeStudy]: [...(prev[activeStudy] || []), {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Welcome! I see you're a ${demographics.userType}. I'm here to help you understand the research papers. Feel free to ask any questions about the study.`,
          timestamp: new Date().toISOString(),
        }]
      }));

    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const togglePanelState = (panel: 'pdf' | 'chat') => {
    setPanelStates(prev => {
      const currentState = prev[panel];
      let newState: PanelState;
      
      switch (currentState) {
        case 'normal':
          newState = 'expanded';
          break;
        case 'expanded':
          newState = 'minimized';
          break;
        case 'minimized':
          newState = 'normal';
          break;
        default:
          newState = 'normal';
      }

      // If expanding one panel, minimize the other
      const otherPanel = panel === 'pdf' ? 'chat' : 'pdf';
      if (newState === 'expanded') {
        return {
          ...prev,
          [panel]: newState,
          [otherPanel]: 'minimized'
        };
      }

      return {
        ...prev,
        [panel]: newState
      };
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [studyMessages[activeStudy]]);

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

    // Add message to memory
    const memory = getMemoryForStudy(activeStudy);
    memory.addMessage(userMessage);

    setStudyMessages(prev => ({
      ...prev,
      [activeStudy]: [...(prev[activeStudy] || []), userMessage]
    }));
    setInput('');
    setIsLoading(true);

    try {
      console.log('=== Starting Chat Process ===');
      console.log('User query:', input);
      
      // Get conversation history
      const recentMessages = memory.getRecentMessages(5);
      const conversationHistory = memory.getHistory();
      console.log('Conversation history:', conversationHistory);
      
      // Use different query function based on active tab
      const searchResults = activeStudy === 'study-1'
        ? await queryDocuments(input)
        : activeStudy === 'female-health'
        ? await queryFemaleAthleteDocuments(input)
        : await querySportScientistDocuments(input);

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

      // Select the appropriate prompt based on the active tab
      let currentPrompt = systemPrompt;
      if (activeStudy !== 'study-1') {
        currentPrompt = sportScientistPrompt;
      }

      console.log('Preparing OpenAI request with system prompt:', currentPrompt);
      
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
              content: currentPrompt
            },
            // Add conversation history
            ...recentMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: `Context: ${context}\n\nPrevious conversation:\n${conversationHistory}\n\nCurrent question: ${input}`
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
        sources: searchResults.map(result => (result.source || '').toString())
      };

      // Add assistant message to memory
      memory.addMessage(assistantMessage);

      console.log('=== Chat Process Complete ===');
      
      console.log('Logging chat to Supabase...');
      try {
        const { error } = await supabase
          .from('chat_logs')
          .insert({
            session_id: sessionId,
            study_number: activeStudy === 'ai-sport-scientist' ? 0 : 
                         activeStudy === 'study-1' ? 1 : 
                         activeStudy === 'study-2' ? 2 : 3,
            query: input,
            response: assistantMessage.content,
            sources: searchResults.map(r => r.source)
          });

        if (error) {
          console.error('Failed to log chat to Supabase:', error);
        } else {
          console.log('Successfully logged chat to Supabase');
        }
      } catch (error) {
        console.error('Failed to log chat to Supabase:', error);
      }
      
      setStudyMessages(prev => ({
        ...prev,
        [activeStudy]: [...(prev[activeStudy] || []), assistantMessage]
      }));
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

  const getPanelWidth = (panel: 'pdf' | 'chat') => {
    const state = panelStates[panel];
    if (state === 'expanded') return 'w-2/3';
    if (state === 'minimized') return 'w-1/3';
    return 'w-1/2'; // normal state
  };

  const messages = studyMessages[activeStudy] || [];
  const setMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setStudyMessages(prev => ({
      ...prev,
      [activeStudy]: Array.isArray(newMessages) ? newMessages : newMessages(prev[activeStudy] || [])
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 relative font-sans">
      {/* Dotted background */}
      <div 
        className="absolute inset-0 bg-[length:16px_16px]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(226, 232, 240) 1px, transparent 0)`,
        }}
        aria-hidden="true"
      />
      
      <div className="relative w-full h-screen flex flex-col">
        <div className="flex-none px-4 py-4">
          <h1 className="text-2xl font-bold text-black dark:text-white text-center">Sport Science AI Collective</h1>
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-4">
          <Tabs value={activeStudy} onValueChange={setActiveStudy} className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-black/10 dark:border-white/10">
              <TabsList className="w-full flex justify-center">
                {[
                  { id: "study-1", name: "Study One", icon: FileText },
                  { id: "sleep-scientist", name: "Riley - Sleep/Recovery Scientist", icon: FileText },
                  { id: "female-health", name: "Avery - Female Athlete Health Expert", icon: FileText },
                  { id: "strength-coach", name: "Morgan - Strength & Conditioning Coach", icon: FileText }
                ].map((study) => (
                  <TabsTrigger
                    key={study.id}
                    value={study.id}
                    className="mx-1 flex items-center"
                  >
                    <study.icon
                      className="mr-2 h-4 w-4 opacity-70"
                      aria-hidden="true"
                    />
                    {study.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="study-1" className="flex-1 min-h-0">
              <div className="flex gap-4 h-full">
                {/* PDF Viewer */}
                <div className={cn(
                  "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-black/10 dark:border-white/10 flex flex-col h-full transition-all duration-200",
                  getPanelWidth('pdf')
                )}>
                  <div className="flex items-center justify-between p-2 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Research Paper</h2>
                    <button
                      onClick={() => togglePanelState('pdf')}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      {panelStates.pdf === 'expanded' ? (
                        <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 p-4">
                    <iframe
                      src="/1736171_Boukhris,O_2024.pdf"
                      className="w-full h-full rounded-lg"
                      title="Research Paper PDF"
                    />
                  </div>
                </div>

                {/* Chat Interface */}
                <div className={cn(
                  "bg-black/[0.01] dark:bg-black/[0.01] rounded-2xl border border-black/10 dark:border-black/10 flex flex-col h-full transition-all duration-200",
                  getPanelWidth('chat')
                )}>
                  <div className="flex items-center justify-between p-2 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {activeStudy === 'study-1' ? 'Chat' :
                       activeStudy === 'sleep-scientist' ? 'Chat with Riley' :
                       activeStudy === 'female-health' ? 'Chat with Avery' :
                       'Chat with Morgan'}
                    </h2>
                    <button
                      onClick={() => togglePanelState('chat')}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      {panelStates.chat === 'expanded' ? (
                        <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="p-4">
                      <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        isLoading={false} 
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <LoadingDots />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Example prompts only show when no messages */}
                  {!showDemographics && messages.length === 0 && (
                    <div className="mb-4 px-4">
                      <h2 className="text-sm font-medium text-black/70 dark:text-white/70 mb-3">Try asking about:</h2>
                      <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(prompt)}
                            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-md px-3 text-xs font-medium text-black/70 dark:text-white/70 outline-none transition-all hover:bg-white/50 dark:hover:bg-black/50"
                          >
                            <span>{prompt}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat input always visible */}
                  {!showDemographics && (
                    <div className="flex-none p-4 border-t border-black/10 dark:border-white/10">
                      <AIInputWithSuggestions
                        value={input}
                        onChange={setInput}
                        onSubmit={(text) => {
                          const e = { preventDefault: () => {} } as React.FormEvent;
                          handleSubmit(e);
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sleep-scientist" className="flex-1 min-h-0">
              <div className="flex gap-4 h-full">
                {/* Chat Interface - Full width */}
                <div className={cn(
                  "bg-black/[0.01] dark:bg-black/[0.01] rounded-2xl border border-black/10 dark:border-black/10 flex flex-col h-full transition-all duration-200 w-full"
                )}>
                  <div className="flex items-center justify-between p-2 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat with Riley</h2>
                  </div>

                  {error && (
                    <div className="p-4">
                      <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        isLoading={false} 
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <LoadingDots />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Example prompts only show when no messages */}
                  {!showDemographics && messages.length === 0 && (
                    <div className="mb-4 px-4">
                      <h2 className="text-sm font-medium text-black/70 dark:text-white/70 mb-3">Try asking about:</h2>
                      <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(prompt)}
                            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-md px-3 text-xs font-medium text-black/70 dark:text-white/70 outline-none transition-all hover:bg-white/50 dark:hover:bg-black/50"
                          >
                            <span>{prompt}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat input always visible */}
                  {!showDemographics && (
                    <div className="flex-none p-4 border-t border-black/10 dark:border-white/10">
                      <AIInputWithSuggestions
                        value={input}
                        onChange={setInput}
                        onSubmit={(text) => {
                          const e = { preventDefault: () => {} } as React.FormEvent;
                          handleSubmit(e);
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="female-health" className="flex-1 min-h-0">
              <div className="flex gap-4 h-full">
                {/* Chat Interface - Full width */}
                <div className={cn(
                  "bg-black/[0.01] dark:bg-black/[0.01] rounded-2xl border border-black/10 dark:border-black/10 flex flex-col h-full transition-all duration-200 w-full"
                )}>
                  <div className="flex items-center justify-between p-2 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat with Avery</h2>
                  </div>

                  {error && (
                    <div className="p-4">
                      <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        isLoading={false} 
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <LoadingDots />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Example prompts only show when no messages */}
                  {!showDemographics && messages.length === 0 && (
                    <div className="mb-4 px-4">
                      <h2 className="text-sm font-medium text-black/70 dark:text-white/70 mb-3">Try asking about:</h2>
                      <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(prompt)}
                            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-md px-3 text-xs font-medium text-black/70 dark:text-white/70 outline-none transition-all hover:bg-white/50 dark:hover:bg-black/50"
                          >
                            <span>{prompt}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat input always visible */}
                  {!showDemographics && (
                    <div className="flex-none p-4 border-t border-black/10 dark:border-white/10">
                      <AIInputWithSuggestions
                        value={input}
                        onChange={setInput}
                        onSubmit={(text) => {
                          const e = { preventDefault: () => {} } as React.FormEvent;
                          handleSubmit(e);
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="strength-coach" className="flex-1 min-h-0">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-400">Morgan's Strength & Conditioning expertise will be available shortly.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DemographicCollector 
        isOpen={showDemographics}
        onComplete={handleDemographicComplete}
      />
    </div>
  );
}

export default App;