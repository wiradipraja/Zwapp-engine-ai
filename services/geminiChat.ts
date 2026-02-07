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

const toSafeRole = (role: GeminiChatRole): GeminiChatRole => {
  if (role === 'developer') return 'system';
  return role;
};

const normalizeMessages = (messages: GeminiChatMessage[], mode: MessageFormatMode = 'array') => {
  if (mode === 'string') {
    return messages
      .map((message) => ({
        role: toSafeRole(message.role),
        content: (message.content || '').trim(),
      }))
      .filter((message) => message.content.length > 0);
  }

  return messages
    .map((message) => ({
      role: toSafeRole(message.role),
      content: [{ type: 'text', text: (message.content || '').trim() }],
    }))
    .filter((message) => message.content[0].text.length > 0);
};

const parseJsonCompletion = (
  payload: any,
  onContentDelta?: (delta: string) => void,
  onReasoningDelta?: (delta: string) => void
): GeminiChatResult => {
  const firstChoice = payload?.choices?.[0] || {};
  const message = firstChoice?.message || firstChoice?.delta || firstChoice || {};

  const content =
    extractTextValue(message?.content) ||
    extractTextValue(payload?.message?.content) ||
    extractTextValue(payload?.data?.content) ||
    '';

  const reasoningContent =
    extractTextValue(message?.reasoning_content) ||
    extractTextValue(firstChoice?.reasoning_content) ||
    extractTextValue(payload?.reasoning_content) ||
    '';

  if (content && onContentDelta) onContentDelta(content);
  if (reasoningContent && onReasoningDelta) onReasoningDelta(reasoningContent);

  return {
    content,
    reasoningContent,
    raw: payload,
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

  const requestOnce = async (
    normalizedMessages: any[],
    stream: boolean,
    includeThoughts: boolean,
    reasoningEffort: 'low' | 'high',
    useCallbacks: boolean
  ): Promise<GeminiChatResult> => {
    if (normalizedMessages.length === 0) {
      throw new Error('At least one chat message is required.');
    }

    const payload = {
      messages: normalizedMessages,
      stream,
      include_thoughts: includeThoughts,
      reasoning_effort: reasoningEffort,
    };

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
    if (contentType.includes('text/event-stream')) {
      return parseSseCompletion(
        response,
        useCallbacks ? options.onContentDelta : undefined,
        useCallbacks ? options.onReasoningDelta : undefined
      );
    }

    const payloadJson = await response.json();
    return parseJsonCompletion(
      payloadJson,
      useCallbacks ? options.onContentDelta : undefined,
      useCallbacks ? options.onReasoningDelta : undefined
    );
  };

  const initialStream = options.stream ?? true;
  const initialIncludeThoughts = options.includeThoughts ?? true;
  const initialReasoningEffort = options.reasoningEffort ?? 'high';

  const primaryMessages = normalizeMessages(messages, 'array');

  try {
    return await requestOnce(
      primaryMessages,
      initialStream,
      initialIncludeThoughts,
      initialReasoningEffort,
      true
    );
  } catch (primaryError: any) {
    const status = Number(primaryError?.status || 0);
    const raw = String(primaryError?.raw || primaryError?.message || '');
    const isRetriable =
      status >= 500 ||
      status === 429 ||
      raw.toLowerCase().includes('server exception') ||
      raw.toLowerCase().includes('internal');

    if (!isRetriable) {
      throw primaryError;
    }

    const fallbackMessages = normalizeMessages(messages, 'string');
    try {
      return await requestOnce(
        fallbackMessages,
        false,
        false,
        'low',
        true
      );
    } catch (fallbackError: any) {
      const fallbackMsg = fallbackError?.message || String(fallbackError);
      throw new Error(`${primaryError?.message || 'Gemini request failed'} | fallback failed: ${fallbackMsg}`);
    }
  }
};
