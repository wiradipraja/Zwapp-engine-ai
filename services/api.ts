import { CreateTaskRequest, CreateTaskResponse, QueryTaskResponse, MotionControlInput, NanoBananaInput, ImageEditInput, ZImageInput, Flux2ProTextInput, Flux2ProImageInput, Flux2FlexTextInput, Flux2FlexImageInput, Sora2Input, GrokImageToVideoInput, GrokImageToImageInput, GrokTextToImageInput, GrokUpscaleInput } from '../types';

// MENGGUNAKAN PROXY VERCEL (lihat vercel.json)
// Ini menghindari masalah CORS yang sering membuat request "stuck" di browser.
const BASE_URL = '/api/proxy/jobs';

export const createTask = async (apiKey: string, model: string, input: MotionControlInput | NanoBananaInput | ImageEditInput | ZImageInput | Flux2ProTextInput | Flux2ProImageInput | Flux2FlexTextInput | Flux2FlexImageInput | Sora2Input | GrokImageToVideoInput | GrokImageToImageInput | GrokTextToImageInput | GrokUpscaleInput): Promise<CreateTaskResponse> => {
  const payload: CreateTaskRequest = {
    model: model,
    input: input,
  };

  try {
    const response = await fetch(`${BASE_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    return response.json();
  } catch (error: any) {
    console.error("Create Task Error:", error);
    throw error;
  }
};

export const queryTask = async (apiKey: string, taskId: string): Promise<QueryTaskResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // ✅ NEW: Validate JSON parsing
    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${parseError}`);
    }

    // ✅ NEW: Check for empty response
    if (!data) {
      throw new Error('Empty response from API');
    }

    // ✅ NEW: Handle KIE API error codes
    const rawCode = data.code;
    const normalizedCode = typeof rawCode === 'string' ? Number(rawCode) : rawCode;
    if (normalizedCode && normalizedCode !== 200) {
      const errorMsg = data.msg || data.error || data.message || 'Unknown error';
      const error = new Error(`API Error (${rawCode}): ${errorMsg}`);
      (error as any).apiCode = data.code;
      (error as any).apiMsg = errorMsg;
      throw error;
    }

    // ✅ NEW: Normalize response shape when provider uses non-standard field names
    if (!data.data) {
      const fallback = data.result || data.record || data.task || data.output || data.value;
      if (fallback) {
        return {
          ...data,
          data: fallback,
        } as QueryTaskResponse;
      }
      console.warn('[queryTask] Response has no data field:', data);
      return data as QueryTaskResponse;
    }

    return data as QueryTaskResponse;
  } catch (error: any) {
    console.error(`[queryTask] Error for ${taskId}:`, {
      message: error.message,
      apiCode: (error as any).apiCode,
      apiMsg: (error as any).apiMsg
    });
    throw error;
  }
};
