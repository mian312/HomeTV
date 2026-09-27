import { createVideoSource } from '@/features/player/player-source';
import type { Stream } from '@/types/domain';

const stream: Stream = {
  channelId: 'channel-1' as Stream['channelId'],
  url: 'https://example.com/live.m3u8?token=test',
  httpReferrer: 'https://example.com/',
  userAgent: 'HomeTV-Test',
};

describe('createVideoSource', () => {
  it('preserves stream headers and identifies HLS sources', () => {
    expect(createVideoSource(stream)).toEqual({
      uri: stream.url,
      headers: {
        Referer: stream.httpReferrer,
        'User-Agent': stream.userAgent,
      },
      contentType: 'hls',
    });
  });

  it('omits empty request headers and keeps progressive source type automatic', () => {
    expect(
      createVideoSource({
        ...stream,
        url: 'https://example.com/live.mp4',
        httpReferrer: null,
        userAgent: null,
      }),
    ).toEqual({ uri: 'https://example.com/live.mp4' });
  });
});
