import { useLocalSearchParams } from 'expo-router';

import { ChannelVideoPlayer } from '@/components/player/channel-video-player';
import { ErrorView, LoadingView } from '@/components/ui';
import { useChannels } from '@/data/queries/iptv';

export default function ChannelPlayerRoute() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { data: channels, isLoading, isError, refetch } = useChannels();
  const channel = channels?.find((entry) => entry.id === channelId);

  if (isLoading) return <LoadingView message="Loading channel..." />;
  if (isError) return <ErrorView message="Could not load channel details." onRetry={refetch} />;
  if (!channel) return <ErrorView message="This channel could not be found." />;

  return <ChannelVideoPlayer channel={channel} />;
}
