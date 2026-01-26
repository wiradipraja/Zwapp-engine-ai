import { CreateTaskRequest, CreateTaskResponse, QueryTaskResponse, MotionControlInput, NanoBananaInput, ImageEditInput, ZImageInput, Flux2ProTextInput, Flux2ProImageInput, Flux2FlexTextInput, Flux2FlexImageInput, Sora2Input, GrokImageToVideoInput, GrokTextToImageInput } from '../types';

// MENGGUNAKAN PROXY VERCEL (lihat vercel.json)
// Ini menghindari masalah CORS yang sering membuat request "stuck" di browser.
const BASE_URL = '/api/proxy/jobs';

export const createTask = async (apiKey: string, model: string, input: MotionControlInput | NanoBananaInput | ImageEditInput | ZImageInput | Flux2ProTextInput | Flux2ProImageInput | Flux2FlexTextInput | Flux2FlexImageInput | Sora2Input | GrokImageToVideoInput | GrokTextToImageInput): Promise<CreateTaskResponse> => {
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
    const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
        // Jika 404/500, jangan throw error object agar polling bisa mencoba lagi, 
        // tapi log ke console
        console.warn(`Query Task Warning: ${response.status} ${response.statusText}`);
        throw new Error(`Status Check Failed: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    throw error;
  }
};
