export type GeminiChatRole = 'developer' | 'system' | 'user' | 'assistant' | 'tool';

export interface GeminiChatMessage {
  role: GeminiChatRole;
  content: string;
}

export interface GeminiChatOptions {
  stream?: boolean;
  includeThoughts?: boolean;
  reasoningEffort?: 'low' | 'high';
  signal?: AbortSignal;
  onContentDelta?: (delta: string) => void;
  onReasoningDelta?: (delta: string) => void;
}

export interface GeminiChatResult {
  content: string;
  reasoningContent: string;
  raw: any;
}

export const DEFAULT_GEMINI_CHAT_DEVELOPER_PROMPT =
  'You are Zwapp Engine Chat Assistant. Give practical, concise, and actionable answers.';

const GEMINI_CHAT_COMPLETIONS_ENDPOINT = '/api/proxy/gemini-3-flash/v1/chat/completions';

type MessageFormatMode = 'array' | 'string';

const extractTextValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map(extractTextValue).join('');
  }

  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (typeof value.content === 'string') return value.content;
    if (Array.isArray(value.content)) return value.content.map(extractTextValue).join('');
    if (Array.isArray(value.parts)) return value.parts.map(extractTextValue).join('');
  }

  return '';
};

const normalizeMessages = (
  messages: GeminiChatMessage[],
  mode: MessageFormatMode = 'array',
  options?: { developerToSystem?: boolean }
) => {
  const mapRole = (role: GeminiChatRole): GeminiChatRole => {
    if (options?.developerToSystem && role === 'developer') return 'system';
    return role;
  };

  if (mode === 'string') {
    return messages
      .map((message) => ({
        role: mapRole(message.role),
        content: (message.content || '').trim(),
      }))
      .filter((message) => message.content.length > 0);
  }

  return messages
    .map((message) => ({
      role: mapRole(message.role),
      content: [{ type: 'text', text: (message.content || '').trim() }],
    }))
    .filter((message) => message.content[0].text.length > 0);
};

const unwrapCompletionEnvelope = (payload: any): any => {
  const candidates = [
    payload,
    payload?.data,
    payload?.result,
    payload?.response,
    payload?.output,
    payload?.data?.data,
    payload?.data?.result,
    payload?.result?.data,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (candidate.choices || candidate.message || candidate.output_text || candidate.content) {
      return candidate;
    }
  }

  return payload;
};

const parseJsonCompletion = (
  payload: any,
  onContentDelta?: (delta: string) => void,
  onReasoningDelta?: (delta: string) => void
): GeminiChatResult => {
  const envelope = unwrapCompletionEnvelope(payload);
  const firstChoice = envelope?.choices?.[0] || {};
  const message = firstChoice?.message || firstChoice?.delta || firstChoice || {};

  const content =
    extractTextValue(message?.content) ||
    extractTextValue(message?.output_text) ||
    extractTextValue(firstChoice?.content) ||
    extractTextValue(envelope?.message?.content) ||
    extractTextValue(envelope?.output_text) ||
    extractTextValue(payload?.data?.choices?.[0]?.message?.content) ||
    extractTextValue(payload?.result?.choices?.[0]?.message?.content) ||
    extractTextValue(payload?.data?.message?.content) ||
    extractTextValue(payload?.data?.content) ||
    '';

  const reasoningContent =
    extractTextValue(message?.reasoning_content) ||
    extractTextValue(message?.reasoning) ||
    extractTextValue(firstChoice?.reasoning_content) ||
    extractTextValue(envelope?.reasoning_content) ||
    extractTextValue(payload?.reasoning_content) ||
    '';

  if (content && onContentDelta) onContentDelta(content);
  if (reasoningContent && onReasoningDelta) onReasoningDelta(reasoningContent);

  return {
    content,
    reasoningContent,
    raw: envelope,
  };
};

const parseSseCompletion = async (
  response: Response,
  onContentDelta?: (delta: string) => void,
  onReasoningDelta?: (delta: string) => void
): Promise<GeminiChatResult> => {
  if (!response.body) {
    throw new Error('Streaming response body is not available.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let reasoningContent = '';
  let done = false;
  let lastChunk: any = null;

  const processEvent = (rawEvent: string) => {
    const normalized = rawEvent.replace(/\r/g, '');
    const dataLines = normalized
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());

    if (dataLines.length === 0) return;

    const payloadText = dataLines.join('\n').trim();
    if (!payloadText) return;

    if (payloadText === '[DONE]') {
      done = true;
      return;
    }

    let chunk: any = null;
    try {
      chunk = JSON.parse(payloadText);
      lastChunk = chunk;
    } catch (_error) {
      return;
    }

    const choice = chunk?.choices?.[0];
    if (!choice) return;

    const delta = choice?.delta || choice?.message || {};
    const deltaContent = extractTextValue(delta?.content);
    const deltaReasoning = extractTextValue(delta?.reasoning_content);

    if (deltaContent) {
      content += deltaContent;
      onContentDelta?.(deltaContent);
    }

    if (deltaReasoning) {
      reasoningContent += deltaReasoning;
      onReasoningDelta?.(deltaReasoning);
    }
  };

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    buffer += decoder.decode(value, { stream: true });
    const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
    const events = normalizedBuffer.split('\n\n');
    buffer = events.pop() || '';

    for (const rawEvent of events) {
      processEvent(rawEvent);
      if (done) break;
    }
  }

  if (buffer.trim()) {
    processEvent(buffer);
  }

  return {
    content,
    reasoningContent,
    raw: lastChunk,
  };
};

export const createGemini3FlashChatCompletion = async (
  apiKey: string,
  messages: GeminiChatMessage[],
  options: GeminiChatOptions = {}
): Promise<GeminiChatResult> => {
  const cleanedApiKey = (apiKey || '').trim();
  if (!cleanedApiKey) {
    throw new Error('KIE API key is required.');
  }

  const requestOnce = async (params: {
    normalizedMessages: any[];
    stream: boolean;
    includeThoughts?: boolean;
    reasoningEffort?: 'low' | 'high';
    useCallbacks: boolean;
  }): Promise<GeminiChatResult> => {
    const {
      normalizedMessages,
      stream,
      includeThoughts,
      reasoningEffort,
      useCallbacks,
    } = params;

    if (normalizedMessages.length === 0) {
      throw new Error('At least one chat message is required.');
    }

    const payload: any = {
      messages: normalizedMessages,
      stream,
    };
    if (typeof includeThoughts === 'boolean') {
      payload.include_thoughts = includeThoughts;
    }
    if (reasoningEffort) {
      payload.reasoning_effort = reasoningEffort;
    }

    const response = await fetch(GEMINI_CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        Authorization: `Bearer ${cleanedApiKey}`,
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Gemini chat request failed (${response.status}): ${errorText.substring(0, 240)}`);
      (error as any).status = response.status;
      (error as any).raw = errorText;
      throw error;
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const parsed = contentType.includes('text/event-stream')
      ? await parseSseCompletion(
        response,
        useCallbacks ? options.onContentDelta : undefined,
        useCallbacks ? options.onReasoningDelta : undefined
      )
      : parseJsonCompletion(
          await response.json(),
          useCallbacks ? options.onContentDelta : undefined,
          useCallbacks ? options.onReasoningDelta : undefined
        );

    const hasContent = (parsed.content || '').trim().length > 0;
    const hasReasoning = (parsed.reasoningContent || '').trim().length > 0;
    if (!hasContent && !hasReasoning) {
      const rawText = (() => {
        try {
          return JSON.stringify(parsed.raw).slice(0, 300);
        } catch (_error) {
          return '';
        }
      })();
      const emptyError = new Error(`Gemini returned empty payload${rawText ? `: ${rawText}` : ''}`);
      (emptyError as any).status = 200;
      throw emptyError;
    }

    return parsed;
  };

  const initialStream = options.stream ?? false;
  const initialIncludeThoughts = options.includeThoughts ?? false;
  const initialReasoningEffort = options.reasoningEffort ?? 'low';

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && (message.content || '').trim().length > 0);

  const minimalUserMessages = lastUserMessage
    ? [{ role: 'user' as const, content: lastUserMessage.content }]
    : [];

  const attempts = [
    {
      normalizedMessages: normalizeMessages(messages, 'array'),
      stream: initialStream,
      includeThoughts: initialIncludeThoughts,
      reasoningEffort: initialReasoningEffort,
      useCallbacks: true,
    },
    {
      normalizedMessages: normalizeMessages(messages, 'array', { developerToSystem: true }),
      stream: false,
      includeThoughts: false,
      reasoningEffort: 'low' as const,
      useCallbacks: true,
    },
    {
      normalizedMessages: normalizeMessages(messages, 'string'),
      stream: false,
      includeThoughts: false,
      reasoningEffort: 'low' as const,
      useCallbacks: true,
    },
    {
      normalizedMessages: normalizeMessages(minimalUserMessages, 'array'),
      stream: false,
      includeThoughts: false,
      reasoningEffort: 'low' as const,
      useCallbacks: true,
    },
    {
      normalizedMessages: normalizeMessages(minimalUserMessages, 'string'),
      stream: false,
      includeThoughts: false,
      reasoningEffort: undefined,
      useCallbacks: true,
    },
  ];

  const errors: string[] = [];

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    if (!attempt.normalizedMessages.length) continue;

    try {
      return await requestOnce(attempt);
    } catch (error: any) {
      const status = Number(error?.status || 0);
      const message = error?.message || String(error);
      errors.push(`attempt ${index + 1}: ${message}`);

      const isAuthError = status === 401 || status === 403;
      if (isAuthError) {
        break;
      }
    }
  }

  throw new Error(errors.join(' | '));
};
