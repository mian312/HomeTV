import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ChannelCard } from '@/components/ui/channel-card';
import { HorizontalList } from '@/components/ui/horizontal-list';
import {
  useAddPlaylistItem,
  useChannelPlaylistMemberships,
  useCreatePlaylist,
  usePlaylists,
  useRemovePlaylistItem,
} from '@/data/queries/local';
import type { Channel } from '@/types/domain';

jest.mock('@/data/queries/local', () => ({
  useIsFavorite: jest.fn(() => ({ data: false })),
  useToggleFavorite: jest.fn(() => ({ mutate: jest.fn() })),
  useChannelPlaylistMemberships: jest.fn(() => ({ data: ['playlist-1', 'playlist-2'] })),
  usePlaylists: jest.fn(() => ({ data: [] })),
  useCreatePlaylist: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useAddPlaylistItem: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useRemovePlaylistItem: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

const mockChannel: Channel = {
  id: 'test-1' as any,
  name: 'Test Channel',
  country: 'US' as any,
  altNames: [],
  network: null,
  subdivision: null,
  city: null,
  categories: [],
  languages: [],
  isNsfw: false,
  logoUrl: null,
  website: null,
  launched: null,
  closed: null,
};

const mockPlaylist = {
  id: 'playlist-1',
  name: 'Evening',
  createdAt: new Date(0),
  updatedAt: new Date(0),
};
const mockUsePlaylists = jest.mocked(usePlaylists);
const mockUseMemberships = jest.mocked(useChannelPlaylistMemberships);
const mockUseCreatePlaylist = jest.mocked(useCreatePlaylist);
const mockUseAddPlaylistItem = jest.mocked(useAddPlaylistItem);
const mockUseRemovePlaylistItem = jest.mocked(useRemovePlaylistItem);
const addPlaylistItem = jest.fn();
const removePlaylistItem = jest.fn();
const createPlaylist = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePlaylists.mockReturnValue({ data: [mockPlaylist] } as never);
  mockUseMemberships.mockReturnValue({ data: [] } as never);
  mockUseCreatePlaylist.mockReturnValue({ mutateAsync: createPlaylist, isPending: false } as never);
  mockUseAddPlaylistItem.mockReturnValue({
    mutateAsync: addPlaylistItem,
    isPending: false,
  } as never);
  mockUseRemovePlaylistItem.mockReturnValue({
    mutateAsync: removePlaylistItem,
    isPending: false,
  } as never);
  createPlaylist.mockResolvedValue({ ...mockPlaylist, id: 'created-playlist', name: 'New List' });
  addPlaylistItem.mockResolvedValue(undefined);
  removePlaylistItem.mockResolvedValue(undefined);
});

describe('ChannelCard', () => {
  it('renders channel name and country', () => {
    render(<ChannelCard channel={mockChannel} />);
    expect(screen.getByText('Test Channel')).toBeTruthy();
    expect(screen.getByText('US')).toBeTruthy();
    expect(screen.getByText('TE')).toBeTruthy(); // initials
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<ChannelCard channel={mockChannel} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Test Channel' }));
    expect(onPress).toHaveBeenCalledWith(mockChannel);
  });

  it('shows how many playlists contain the channel', () => {
    mockUseMemberships.mockReturnValue({ data: ['playlist-1', 'playlist-2'] } as never);
    render(<ChannelCard channel={mockChannel} />);
    expect(screen.getByTestId('channel-playlist-action').props.accessibilityLabel).toBe(
      'Add Test Channel to a playlist. In 2 playlists.',
    );
  });

  it('opens the playlist picker from the channel card', () => {
    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByTestId('channel-playlist-action'));
    expect(screen.getByText('Add to playlist')).toBeTruthy();
  });

  it('adds the channel to a selected playlist', async () => {
    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByTestId('channel-playlist-action'));
    fireEvent.press(screen.getByText('Evening'));

    await waitFor(() =>
      expect(addPlaylistItem).toHaveBeenCalledWith({
        playlistId: 'playlist-1',
        entityRef: { entityType: 'channel', entityId: mockChannel.id },
      }),
    );
  });

  it('removes the channel from a playlist it already belongs to', async () => {
    mockUseMemberships.mockReturnValue({ data: ['playlist-1'] } as never);
    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByTestId('channel-playlist-action'));
    fireEvent.press(screen.getByText('Evening'));

    await waitFor(() =>
      expect(removePlaylistItem).toHaveBeenCalledWith({
        playlistId: 'playlist-1',
        entityRef: { entityType: 'channel', entityId: mockChannel.id },
      }),
    );
  });

  it('creates a playlist and adds the channel to it', async () => {
    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByTestId('channel-playlist-action'));
    fireEvent.changeText(screen.getByPlaceholderText('New playlist name'), 'New List');
    fireEvent.press(screen.getByText('Create and add channel'));

    await waitFor(() => {
      expect(createPlaylist).toHaveBeenCalledWith({ name: 'New List' });
      expect(addPlaylistItem).toHaveBeenCalledWith({
        playlistId: 'created-playlist',
        entityRef: { entityType: 'channel', entityId: mockChannel.id },
      });
    });
  });
});

describe('HorizontalList', () => {
  it('renders title and items', () => {
    render(
      <HorizontalList
        title="Featured"
        data={[mockChannel]}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ChannelCard channel={item} />}
      />,
    );
    expect(screen.getByText('Featured')).toBeTruthy();
    expect(screen.getByText('Test Channel')).toBeTruthy();
  });

  it('renders See All button when onSeeAll is provided', () => {
    const onSeeAll = jest.fn();
    render(
      <HorizontalList
        title="Featured"
        data={[mockChannel]}
        onSeeAll={onSeeAll}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ChannelCard channel={item} />}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'See all Featured' }));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
