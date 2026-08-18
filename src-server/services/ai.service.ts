import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let geminiRateLimitCooldownUntil = 0;
const aiResponseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function callGeminiSafe(prompt: string, cacheKey?: string): Promise<{ parsed: any; note?: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  if (cacheKey && aiResponseCache.has(cacheKey)) {
    const cached = aiResponseCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { parsed: cached.data };
    }
  }

  if (Date.now() < geminiRateLimitCooldownUntil) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    if (cacheKey) {
      aiResponseCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
    }

    return { parsed };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      geminiRateLimitCooldownUntil = Date.now() + 30000;
      console.log('[Gemini API] Free tier quota rate limit reached (429). Using EDIMP rule-based engine fallback.');
    } else {
      console.log('[Gemini API] Notice:', errMsg.slice(0, 100));
    }
    return null;
  }
}
