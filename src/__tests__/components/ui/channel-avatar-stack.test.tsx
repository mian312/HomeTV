import { render, screen } from '@testing-library/react-native';

import { ChannelAvatarStack } from '@/components/ui/channel-avatar-stack';
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
});
