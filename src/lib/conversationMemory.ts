import { Message } from '../types';

export interface ConversationMemory {
  messages: Message[];
  maxTokens?: number;
}

export class ConversationBufferMemory {
  private memory: ConversationMemory;

  constructor(maxTokens: number = 2000) {
    this.memory = {
      messages: [],
      maxTokens
    };
  }

  addMessage(message: Message) {
    this.memory.messages.push(message);
  }

  getHistory(): string {
    return this.memory.messages
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  clear() {
    this.memory.messages = [];
  }

  // Get the last n messages
  getRecentMessages(n: number = 5): Message[] {
    return this.memory.messages.slice(-n);
  }
}

// Singleton instance for each study/context
const memoryInstances: { [key: string]: ConversationBufferMemory } = {
  'study-1': new ConversationBufferMemory(),
  'sleep-scientist': new ConversationBufferMemory(),
  'female-health': new ConversationBufferMemory(),
  'strength-coach': new ConversationBufferMemory()
};

export function getMemoryForStudy(studyId: string): ConversationBufferMemory {
  return memoryInstances[studyId];
} 