import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  createGemini3FlashChatCompletion,
  DEFAULT_GEMINI_CHAT_DEVELOPER_PROMPT,
  GeminiChatMessage,
} from '../services/geminiChat';
import { Button } from './ui/Button';

type ReasoningEffort = 'low' | 'high';

interface ChatEngineViewProps {
  apiKey: string;
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning: string;
  status: 'done' | 'streaming' | 'error';
}

const CHAT_CONTEXT_LIMIT = 20;

const makeMessageId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const ChatEngineView: React.FC<ChatEngineViewProps> = ({ apiKey, onOpenSettings }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [includeThoughts, setIncludeThoughts] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('low');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastResolvedModel, setLastResolvedModel] = useState('gemini-3-flash');
  const endRef = useRef<HTMLDivElement | null>(null);

  const resolvedApiKey = useMemo(() => {
    return (apiKey || localStorage.getItem('kie_api_key') || '').trim();
  }, [apiKey]);

  const hasApiKey = resolvedApiKey.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    setErrorMessage('');
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || isSending) return;

    if (!hasApiKey) {
      setErrorMessage('KIE API Key belum diisi. Buka Settings untuk menyimpan key.');
      onOpenSettings();
      return;
    }

    setErrorMessage('');
    setPrompt('');

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: 'user',
      content: text,
      reasoning: '',
      status: 'done',
    };

    const assistantMessageId = makeMessageId();
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      reasoning: '',
      status: 'streaming',
    };

    setMessages((prev) => [...prev, userMessage, placeholderAssistantMessage]);
    setIsSending(true);

    const history: GeminiChatMessage[] = [
      {
        role: 'developer',
        content: DEFAULT_GEMINI_CHAT_DEVELOPER_PROMPT,
      },
      ...[...messages, userMessage]
        .slice(-CHAT_CONTEXT_LIMIT)
        .filter((message) => message.status !== 'error')
        .filter((message) => (message.content || '').trim().length > 0)
        .filter((message) => message.content !== 'Model tidak mengembalikan konten.')
        .filter((message) => !message.content.startsWith('Error:'))
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    ];

    const appendAssistantField = (field: 'content' | 'reasoning', delta: string) => {
      if (!delta) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                [field]: `${message[field]}${delta}`,
              }
            : message
        )
      );
    };

    try {
      const response = await createGemini3FlashChatCompletion(resolvedApiKey, history, {
        stream: false,
        includeThoughts,
        reasoningEffort,
        onContentDelta: (delta) => appendAssistantField('content', delta),
        onReasoningDelta: (delta) => appendAssistantField('reasoning', delta),
      });
      if (response.model) {
        setLastResolvedModel(response.model);
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== assistantMessageId) return message;

          const finalContent = (message.content || response.content || '').trim();
          const finalReasoning = (message.reasoning || response.reasoningContent || '').trim();
          if (!finalContent) {
            if (finalReasoning) {
              return {
                ...message,
                content: finalReasoning,
                reasoning: '',
                status: 'done',
              };
            }

            return {
              ...message,
              content: 'Error: Model tidak mengembalikan konten.',
              reasoning: '',
              status: 'error',
            };
          }

          return {
            ...message,
            content: finalContent,
            reasoning: finalReasoning,
            status: 'done',
          };
        })
      );
    } catch (error: any) {
      const message = error?.message || 'Unknown error while requesting Gemini 3 Flash.';
      setErrorMessage(message);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                content: `Error: ${message}`,
                reasoning: '',
                status: 'error',
              }
            : item
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col gap-4">
        <div
          className={`flex items-center justify-between border px-4 py-3 ${
            isDark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white'
          }`}
        >
          <div>
            <p className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>MODEL</p>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lastResolvedModel}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  hasApiKey ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                {hasApiKey ? 'KIE KEY READY' : 'KIE KEY MISSING'}
              </span>
            </div>
            <button
              onClick={onOpenSettings}
              className={`px-3 py-2 text-xs font-mono transition-colors ${
                isDark
                  ? 'border border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-orange-400'
                  : 'border border-zinc-300 text-zinc-700 hover:border-orange-500 hover:text-orange-600'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto border p-4 ${
            isDark ? 'border-zinc-800 bg-zinc-950/70' : 'border-zinc-200 bg-white'
          }`}
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center">
                <p className={`text-sm font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Chat engine siap digunakan.
                </p>
                <p className={`mt-2 text-xs font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Tulis prompt di bawah untuk mulai percakapan dengan Gemini 3 Flash.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] border px-4 py-3 ${
                      message.role === 'user'
                        ? isDark
                          ? 'border-orange-500/40 bg-orange-500/10 text-orange-100'
                          : 'border-orange-300 bg-orange-50 text-zinc-900'
                        : message.status === 'error'
                        ? isDark
                          ? 'border-red-500/40 bg-red-500/10 text-red-200'
                          : 'border-red-300 bg-red-50 text-red-700'
                        : isDark
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-800'
                    }`}
                  >
                    <p className="mb-2 text-[10px] font-mono uppercase tracking-wide opacity-70">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content || '...'}</p>

                    {message.reasoning && (
                      <details className="mt-3 border-t border-current/20 pt-2">
                        <summary className="cursor-pointer text-[10px] font-mono uppercase opacity-70">
                          Reasoning
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed opacity-90">
                          {message.reasoning}
                        </pre>
                      </details>
                    )}

                    {message.status === 'streaming' && (
                      <p className="mt-2 text-[10px] font-mono uppercase opacity-70">Generating...</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-3 border p-4 ${isDark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <input
                  type="checkbox"
                  checked={includeThoughts}
                  onChange={(event) => setIncludeThoughts(event.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
                include_thoughts
              </label>

              <label className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                reasoning_effort
                <select
                  value={reasoningEffort}
                  onChange={(event) => setReasoningEffort(event.target.value as ReasoningEffort)}
                  className={`border px-2 py-1 text-xs font-mono ${
                    isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-200' : 'border-zinc-300 bg-white text-zinc-700'
                  }`}
                >
                  <option value="high">high</option>
                  <option value="low">low</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              className={`text-xs font-mono transition-colors ${
                isDark ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-500 hover:text-red-600'
              }`}
            >
              Clear Chat
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
              }
            }}
            rows={3}
            placeholder="Tulis pertanyaan kamu..."
            className={`w-full resize-none border px-3 py-2 text-sm transition-colors ${
              isDark
                ? 'border-zinc-700 bg-zinc-950 text-white placeholder-zinc-600 focus:border-orange-500'
                : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
            } focus:outline-none`}
          />

          {errorMessage && (
            <p className={`text-xs font-mono ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errorMessage}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSending} disabled={!prompt.trim()}>
              {isSending ? 'SENDING...' : 'SEND MESSAGE'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatEngineView;
