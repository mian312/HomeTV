import type { VideoSource } from 'expo-video';

import type { Stream } from '@/types/domain';

export function createVideoSource(stream: Stream): VideoSource {
  const headers: Record<string, string> = {};
  if (stream.httpReferrer) headers.Referer = stream.httpReferrer;
  if (stream.userAgent) headers['User-Agent'] = stream.userAgent;

  const isHls = /\.m3u8(?:$|[?#])/i.test(stream.url);

  return {
    uri: stream.url,
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(isHls ? { contentType: 'hls' as const } : {}),
  };
}
