import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChannelAvatarStack } from '@/components/ui/channel-avatar-stack';
import { ChannelLogo } from '@/components/ui/channel-logo';
import type { Channel } from '@/types/domain';

const channels = ['Alpha', 'Bravo', 'Charlie', 'Delta'].map((name, index) => ({
  id: `channel-${index}` as Channel['id'],
  name,
  altNames: [],
  network: null,
  country: null,
  subdivision: null,
  city: null,
  categories: [],
  languages: [],
  isNsfw: false,
  logoUrl: null,
  website: null,
  launched: null,
  closed: null,
}));

describe('ChannelAvatarStack', () => {
  it('shows the first three channels and an overflow count', () => {
    render(<ChannelAvatarStack channels={channels} />);

    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.queryByText('D')).toBeNull();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('falls back to channel initials if a remote logo fails', () => {
    const channel = { ...channels[0], logoUrl: 'https://example.com/broken.png' };
    render(<ChannelLogo channel={channel} style={{ width: 64, height: 64 }} />);

    fireEvent(screen.getByLabelText('Alpha logo'), 'error', {
      nativeEvent: { error: 'Not found' },
    });

    expect(screen.getByText('AL')).toBeTruthy();
  });
});
