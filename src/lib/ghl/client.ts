import { toast } from 'sonner';

export class GhlError extends Error {
  status: number;
  code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'GhlError';
    this.status = status;
    this.code = code;
  }
}

// Token bucket rate limiter
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number = 10;
  private readonly refillRate: number = 10; // tokens per second

  constructor() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / (this.refillRate / 1000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    this.tokens -= 1;
  }

  private refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * (this.refillRate / 1000);
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

const rateLimiter = new RateLimiter();

// In-flight deduplication
const inFlightRequests = new Map<string, Promise<any>>();

function getRequestHash(method: string, path: string, body?: any): string {
  return `${method}:${path}:${body ? JSON.stringify(body) : ''}`;
}

// Module-level credential store (set at bootstrap)
let currentPit: string | null = null;
let currentLocationId: string | null = null;

export function setGhlCredentials(pit: string | null, locationId: string | null) {
  currentPit = pit;
  currentLocationId = locationId;
}

export function getGhlCredentials() {
  return { pit: currentPit, locationId: currentLocationId };
}

interface GhlFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  query?: Record<string, any>;
  skipDedupe?: boolean;
}

export async function ghlFetch<T>(path: string, options: GhlFetchOptions = {}): Promise<T> {
  const { pit } = getGhlCredentials();
  
  if (!pit) {
    throw new GhlError('GHL credentials not configured', 401, 'missing_credentials');
  }

  const method = options.method || 'GET';
  
  // Build URL with query params
  const url = new URL(`https://services.leadconnectorhq.com${path}`);
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const hash = getRequestHash(method, url.toString(), options.body);

  if (!options.skipDedupe && method === 'GET' && inFlightRequests.has(hash)) {
    return inFlightRequests.get(hash) as Promise<T>;
  }

  const requestPromise = (async () => {
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      await rateLimiter.acquire();

      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${pit}`);
      headers.set('Version', '2021-07-28');
      headers.set('Accept', 'application/json');
      
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      try {
        const response = await fetch(url.toString(), {
          ...options,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (response.ok) {
          if (response.status === 204) return {} as T;
          return (await response.json()) as T;
        }

        if (response.status === 401) {
          // Emit unauthorized event (can be caught by layout to redirect)
          window.dispatchEvent(new CustomEvent('ghl:unauthorized'));
          throw new GhlError('Unauthorized', 401);
        }

        if (response.status === 429 && retries < maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }
        
        if (response.status >= 500 && retries < 1) { // Retry 5xx once
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
          continue;
        }

        let errorMessage = 'GHL API Error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Use status text if JSON parse fails
          errorMessage = response.statusText;
        }

        throw new GhlError(errorMessage, response.status);
      } catch (error) {
        if (error instanceof GhlError) throw error;
        throw new GhlError(error instanceof Error ? error.message : 'Network error', 0);
      }
    }
    throw new GhlError('Max retries exceeded', 429);
  })();

  if (!options.skipDedupe && method === 'GET') {
    inFlightRequests.set(hash, requestPromise);
    requestPromise.finally(() => {
      inFlightRequests.delete(hash);
    });
  }

  return requestPromise;
}

export async function validateCredentials(pit: string, locationId: string) {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${pit}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { ok: true, locationName: data.location?.name || 'Location' };
    }
    return { ok: false };
  } catch (e) {
    return { ok: false };
  }
}
