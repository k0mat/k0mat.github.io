import { CORSBlockedError, ProviderAuthError, RateLimitError } from './adapters';

export type ValidateResult = { ok: boolean; message: string };

export async function validateOpenRouterKey(apiKey: string): Promise<ValidateResult> {
  if (!apiKey) return { ok: false, message: 'Missing API key' };
  const url = 'https://openrouter.ai/api/v1/models';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  }).catch((e) => {
    if ((e as any)?.name === 'AbortError') throw e;
    throw new CORSBlockedError('Network/CORS error contacting OpenRouter');
  });

  if (res.status === 401) throw new ProviderAuthError('Unauthorized: invalid or missing key');
  if (res.status === 429) throw new RateLimitError('Rate limited');
  if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };

  // If response is OK and JSON parses, we consider it valid
  try {
    await res.json();
  } catch {
    // Some proxies might block JSON; still treat 200 as valid
  }
  return { ok: true, message: 'Key is valid' };
}

