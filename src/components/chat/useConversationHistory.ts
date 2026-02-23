// @ts-ignore -- Allows standalone file type-check in environments without installed React type packages.
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'gem-chat-conversations';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UseConversationHistoryReturn {
  messages: ConversationMessage[];
  addMessage: (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

const isConversationRole = (
  value: unknown,
): value is ConversationMessage['role'] => value === 'user' || value === 'assistant';

const isConversationMessage = (value: unknown): value is ConversationMessage => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    isConversationRole(candidate.role) &&
    typeof candidate.content === 'string' &&
    typeof candidate.timestamp === 'number'
  );
};

const loadInitialMessages = (): ConversationMessage[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isConversationMessage);
  } catch {
    return [];
  }
};

const persistMessages = (messages: ConversationMessage[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (messages.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore localStorage failures (e.g. disabled storage or quota exceeded).
  }
};

export function useConversationHistory(): UseConversationHistoryReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>(loadInitialMessages);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  const addMessage: UseConversationHistoryReturn['addMessage'] = (msg) => {
    const now = Date.now();
    const nextMessage: ConversationMessage = {
      id: `${now}-${Math.random().toString(36).slice(2, 10)}`,
      role: msg.role,
      content: msg.content,
      timestamp: now,
    };

    setMessages((prevMessages: ConversationMessage[]) => [...prevMessages, nextMessage]);
  };

  const clearHistory = (): void => {
    setMessages([]);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore localStorage failures.
      }
    }
  };

  return {
    messages,
    addMessage,
    clearHistory,
  };
}
