import { IptvOrgProvider } from '@/data/providers/iptv-org';

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  } as Response;
}

describe('IptvOrgProvider channel logos', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('joins an active raster logo onto its channel', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'test.us',
            name: 'Test TV',
            alt_names: [],
            categories: [],
            is_nsfw: false,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            channel: 'test.us',
            url: 'https://example.com/test.svg',
            format: 'SVG',
            in_use: true,
          },
          {
            channel: 'test.us',
            url: 'https://example.com/test.png',
            format: 'PNG',
            in_use: true,
          },
          {
            channel: 'test.us',
            url: 'https://example.com/old.png',
            format: 'PNG',
            in_use: false,
          },
        ]),
      );

    const [channel] = await new IptvOrgProvider().getChannels();

    expect(channel.logoUrl).toBe('https://example.com/test.png');
  });

  it('still returns channels when the optional logo feed is unavailable', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'test.us',
            name: 'Test TV',
            alt_names: [],
            categories: [],
            is_nsfw: false,
          },
        ]),
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Unavailable',
      } as Response);

    const [channel] = await new IptvOrgProvider().getChannels();

    expect(channel.name).toBe('Test TV');
    expect(channel.logoUrl).toBeNull();
  });
});
