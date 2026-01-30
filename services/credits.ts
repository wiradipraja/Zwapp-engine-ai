/**
 * Credit pricing for different AI models
 * Based on KIE.AI pricing: https://kie.ai/pricing
 * Prices are typically 30-50% lower than official APIs
 */

export const CREDIT_PRICING: Record<string, number> = {
  // Motion Control - Kling 2.6
  'kling-2.6/motion-control': 300,
  
  // Nano Banana
  'google/nano-banana': 10,
  'google/nano-banana-edit': 15,
  'nano-banana-pro': 20,
  
  // Qwen Image
  'qwen/image-to-image': 20,
  
  // Z-Image
  'z-image': 15,

  // Pixazo Stable Diffusion (not billed via KIE credits)
  'pixazo/sdxl-image': 0,
  'pixazo/sd-inpaint': 0,
  'pixazo/flux-schnell': 0,
  'pixazo/kling-motion-control': 0,
  
  // Other common models (for reference)
  'flux-2/pro-text-to-image': 50,
  'grok-imagine/text-to-image': 30,
  'seedream/generate': 25,
};

/**
 * Get credit cost for a specific model
 */
export const getCreditCost = (modelName: string): number => {
  return CREDIT_PRICING[modelName] ?? 10; // Default 10 credits if model not found
};

/**
 * Format credits display (e.g., "150 credits")
 */
export const formatCredits = (credits: number): string => {
  return `${credits.toLocaleString()} credits`;
};

/**
 * KIE.AI Credit API Response interface based on PRD
 * GET https://api.kie.ai/api/v1/chat/credit
 */
export interface KIECreditResponse {
  code: 200 | 401 | 402 | 404 | 422 | 429 | 455 | 500 | 505;
  msg: string;
  data: number; // Remaining credit quantity
}

/**
 * Credit API error codes from KIE.AI PRD
 */
export const CREDIT_ERROR_CODES: Record<number, string> = {
  200: 'Success - Request has been processed successfully',
  401: 'Unauthorized - Authentication credentials are missing or invalid',
  402: 'Insufficient Credits - Account does not have enough credits to perform the operation',
  404: 'Not Found - The requested resource or endpoint does not exist',
  422: 'Validation Error - The request parameters failed validation checks',
  429: 'Rate Limited - Request limit has been exceeded for this resource',
  455: 'Service Unavailable - System is currently undergoing maintenance',
  500: 'Server Error - An unexpected error occurred while processing the request',
  505: 'Feature Disabled - The requested feature is currently disabled',
};

/**
 * Fetch user's current credit balance from KIE.AI
 * Primary endpoint: GET /api/v1/chat/credit (based on PRD)
 * Uses Vercel proxy to avoid CORS issues (in production and dev)
 * 
 * Reference Python code:
 * headers = {
 *   'Accept': 'application/json',
 *   'Authorization': 'Bearer <token>'
 * }
 * response = requests.request("GET", url, headers=headers, data=payload)
 */
export const fetchUserCredits = async (apiKey: string): Promise<number> => {
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[Credits] No API key provided');
    return 0;
  }

  try {
    // Primary endpoint: chat/credit - Official KIE.AI credit endpoint (PRD)
    // Headers match exact Python reference: Accept + Authorization only
    try {
      const response = await fetch('/api/proxy/chat/credit', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        // No body/payload for GET request (matches Python: data=payload where payload={})
      });
      
      if (response.ok) {
        const data: KIECreditResponse = await response.json();
        
        // Handle KIE.AI specific response format
        if (data.code === 200 && typeof data.data === 'number') {
          console.log('[Credits] Successfully fetched from /chat/credit:', data.data);
          return data.data;
        } else if (data.code !== 200) {
          const errorMsg = CREDIT_ERROR_CODES[data.code] || data.msg || 'Unknown error';
          console.warn(`[Credits] KIE.AI API error (${data.code}): ${errorMsg}`);
          
          // If insufficient credits, return 0
          if (data.code === 402) {
            return 0;
          }
        }
        
        // Fallback parsing for different response structures
        const credits = parseCreditsFromResponse(data);
        console.log('[Credits] Parsed credits from /chat/credit:', credits);
        return credits;
      } else if (response.status === 404 || response.status === 401) {
        console.log(`[Credits] Endpoint /chat/credit returned ${response.status}, trying alternatives...`);
      } else {
        console.warn(`[Credits] Unexpected status ${response.status} from /chat/credit`);
      }
    } catch (e) {
      console.log('[Credits] Primary endpoint (/chat/credit) fetch failed, trying alternatives...');
    }

    // Secondary endpoint: user info - using proxy
    try {
      const response = await fetch('/api/proxy/user/info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const credits = parseCreditsFromResponse(data);
        console.log('[Credits] Successfully fetched from /user/info:', credits);
        return credits;
      } else if (response.status === 404 || response.status === 401) {
        console.log(`[Credits] Endpoint /user/info returned ${response.status}, trying alternatives...`);
      } else {
        console.warn(`[Credits] Unexpected status ${response.status} from /user/info`);
      }
    } catch (e) {
      console.log('[Credits] Secondary endpoint fetch failed, trying alternatives...');
    }

    // Alternative endpoint: user account
    try {
      const response = await fetch('/api/proxy/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const credits = parseCreditsFromResponse(data);
        console.log('[Credits] Successfully fetched from /user:', credits);
        return credits;
      } else if (response.status === 404 || response.status === 401) {
        console.log(`[Credits] Endpoint /user returned ${response.status}, trying next...`);
      }
    } catch (e) {
      console.log('[Credits] Alternative endpoint 1 failed...');
    }

    // Fallback endpoint: account
    try {
      const response = await fetch('/api/proxy/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const credits = parseCreditsFromResponse(data);
        console.log('[Credits] Successfully fetched from /account:', credits);
        return credits;
      }
    } catch (e) {
      console.log('[Credits] Fallback endpoint also failed...');
    }

    console.warn('[Credits] All endpoints exhausted, returning 0. Check API key validity.');
    return 0;
  } catch (error) {
    console.error('[Credits] Fatal error fetching credits:', error);
    return 0;
  }
};

/**
 * Parse credit balance from different API response formats
 * Handles KIE.AI PRD format and legacy formats
 * 
 * KIE.AI PRD Format:
 * {
 *   "code": 200,
 *   "msg": "success",
 *   "data": 12345  // Remaining credit quantity (direct number)
 * }
 */
const parseCreditsFromResponse = (data: any): number => {
  if (!data) {
    console.debug('[Credits] Response is null or undefined');
    return 0;
  }
  
  // KIE.AI PRD format: data is a direct number when code === 200
  if (data.code === 200 && typeof data.data === 'number') {
    return data.data;
  }
  
  // Try different possible response structures
  const balance = 
    (typeof data.data === 'number' ? data.data : null) ?? // KIE.AI PRD format: { data: 12345 }
    data.data?.balance ?? // Nested structure: { data: { balance: X } }
    data.data?.credits ?? // Nested structure: { data: { credits: X } }
    data.data?.remaining ?? // Nested structure: { data: { remaining: X } }
    data.balance ??        // Flat structure: { balance: X }
    data.credits ??        // Flat structure: { credits: X }
    data.remaining ??      // Flat structure: { remaining: X }
    data.user?.balance ??  // User object structure
    data.user?.credits ??
    data.user?.remaining ??
    0;
  
  // Ensure we return a valid number
  const numBalance = Number(balance);
  const result = isNaN(numBalance) ? 0 : numBalance;
  
  if (result === 0) {
    console.debug('[Credits] Response structure:', JSON.stringify(data).substring(0, 200));
  }
  
  return result;
};

/**
 * Format large credit numbers (e.g., 150000 → 150k)
 */
export const formatCreditsShort = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}k`;
  }
  return credits.toString();
};

/**
 * Get warning level for credit balance
 */
export const getCreditWarningLevel = (current: number, cost: number): 'safe' | 'warning' | 'danger' => {
  if (current < cost) {
    return 'danger'; // Not enough credits
  }
  if (current < cost * 3) {
    return 'warning'; // Only enough for 3 generations
  }
  return 'safe'; // Plenty of credits
};

/**
 * Credit check result interface
 */
export interface CreditCheckResult {
  hasEnoughCredits: boolean;
  currentBalance: number;
  requiredCredits: number;
  remainingAfter: number;
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Check if user has sufficient credits before performing an operation
 * @param apiKey - KIE.AI API key
 * @param requiredCredits - Number of credits needed for the operation
 * @returns CreditCheckResult with balance info and validation status
 */
export const checkSufficientCredits = async (
  apiKey: string, 
  requiredCredits: number
): Promise<CreditCheckResult> => {
  const currentBalance = await fetchUserCredits(apiKey);
  const hasEnough = currentBalance >= requiredCredits;
  
  return {
    hasEnoughCredits: hasEnough,
    currentBalance,
    requiredCredits,
    remainingAfter: hasEnough ? currentBalance - requiredCredits : 0,
    errorCode: hasEnough ? undefined : 402,
    errorMessage: hasEnough ? undefined : CREDIT_ERROR_CODES[402],
  };
};

/**
 * Fetch credits with detailed response including error information
 * Useful for displaying detailed status in UI
 */
export const fetchCreditsWithDetails = async (apiKey: string): Promise<{
  success: boolean;
  credits: number;
  code: number;
  message: string;
}> => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      credits: 0,
      code: 401,
      message: CREDIT_ERROR_CODES[401],
    };
  }

  try {
    const response = await fetch('/api/proxy/chat/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data: KIECreditResponse = await response.json();
      
      return {
        success: data.code === 200,
        credits: data.code === 200 ? data.data : 0,
        code: data.code,
        message: data.msg || CREDIT_ERROR_CODES[data.code] || 'Unknown status',
      };
    }

    return {
      success: false,
      credits: 0,
      code: response.status,
      message: `HTTP Error: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      credits: 0,
      code: 500,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
};

/**
 * Get human-readable error message for credit API error codes
 */
export const getCreditErrorMessage = (code: number): string => {
  return CREDIT_ERROR_CODES[code] || `Unknown error (code: ${code})`;
};

/**
 * Calculate estimated credits needed for a batch operation
 */
export const calculateBatchCreditCost = (
  modelName: string, 
  quantity: number
): number => {
  const costPerUnit = getCreditCost(modelName);
  return costPerUnit * quantity;
};

/**
 * Monitor credit usage and provide recommendations
 */
export const getCreditUsageRecommendation = (
  currentBalance: number,
  avgUsagePerDay: number
): {
  daysRemaining: number;
  recommendation: 'plenty' | 'monitor' | 'low' | 'critical';
  message: string;
} => {
  if (avgUsagePerDay <= 0) {
    return {
      daysRemaining: Infinity,
      recommendation: 'plenty',
      message: 'No usage data available',
    };
  }

  const daysRemaining = Math.floor(currentBalance / avgUsagePerDay);

  if (daysRemaining > 30) {
    return {
      daysRemaining,
      recommendation: 'plenty',
      message: `You have approximately ${daysRemaining} days of credits remaining`,
    };
  } else if (daysRemaining > 7) {
    return {
      daysRemaining,
      recommendation: 'monitor',
      message: `Monitor your usage - approximately ${daysRemaining} days remaining`,
    };
  } else if (daysRemaining > 1) {
    return {
      daysRemaining,
      recommendation: 'low',
      message: `Low credits - only ${daysRemaining} days remaining. Consider replenishing.`,
    };
  } else {
    return {
      daysRemaining,
      recommendation: 'critical',
      message: 'Critical: Credits running out soon. Replenish immediately.',
    };
  }
};
