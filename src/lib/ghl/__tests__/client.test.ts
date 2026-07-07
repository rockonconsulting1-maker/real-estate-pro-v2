import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ghlFetch, setGhlCredentials, GhlError } from '../client';

describe('ghlFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    setGhlCredentials('test-pit', 'test-location');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setGhlCredentials(null, null);
  });

  it('throws if credentials are not configured', async () => {
    setGhlCredentials(null, null);
    await expect(ghlFetch('/test')).rejects.toThrow('GHL credentials not configured');
  });

  it('adds Authorization and Version headers', async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as any);

    await ghlFetch('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://services.leadconnectorhq.com/test',
      expect.objectContaining({
        headers: expect.any(Headers)
      })
    );
    
    const headers = mockFetch.mock.calls[0][1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-pit');
    expect(headers.get('Version')).toBe('2021-07-28');
  });

  it('retries on 429 status', async () => {
    const mockFetch = vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '0.1' }),
        json: async () => ({})
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as any);

    const result = await ghlFetch('/test');
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('emits ghl:unauthorized event on 401', async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({})
    } as any);

    const eventSpy = vi.fn();
    window.addEventListener('ghl:unauthorized', eventSpy);

    await expect(ghlFetch('/test')).rejects.toThrow(GhlError);
    expect(eventSpy).toHaveBeenCalled();
    
    window.removeEventListener('ghl:unauthorized', eventSpy);
  });
});
