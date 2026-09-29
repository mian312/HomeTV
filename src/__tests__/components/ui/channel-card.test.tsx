import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { ChannelCard } from '@/components/ui/channel-card';
import { HorizontalList } from '@/components/ui/horizontal-list';
import { useGuide } from '@/data/queries/iptv';
import {
    useAddPlaylistItem,
    useChannelPlaylistMemberships,
    useCreatePlaylist,
    useIsFavorite,
    usePlaylists,
    useRemovePlaylistItem,
    useToggleFavorite,
} from '@/data/queries/local';
import type { Channel, GuideEntry } from '@/types/domain';

jest.mock('@/data/queries/local', () => ({
  useIsFavorite: jest.fn(() => ({ data: false })),
  useToggleFavorite: jest.fn(() => ({ mutate: jest.fn() })),
  useChannelPlaylistMemberships: jest.fn(() => ({ data: ['playlist-1', 'playlist-2'] })),
  usePlaylists: jest.fn(() => ({ data: [] })),
  useCreatePlaylist: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useAddPlaylistItem: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useRemovePlaylistItem: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

jest.mock('@/data/queries/iptv', () => ({
  useGuide: jest.fn(() => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() })),
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
const mockUseIsFavorite = jest.mocked(useIsFavorite);
const mockUseAddPlaylistItem = jest.mocked(useAddPlaylistItem);
const mockUseRemovePlaylistItem = jest.mocked(useRemovePlaylistItem);
const mockUseToggleFavorite = jest.mocked(useToggleFavorite);
const mockUseGuide = jest.mocked(useGuide);
const mockUseRouter = jest.mocked(useRouter);
const navigateToPlayer = jest.fn();
const addPlaylistItem = jest.fn();
const removePlaylistItem = jest.fn();
const createPlaylist = jest.fn();
const toggleFavorite = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({
    push: navigateToPlayer,
    back: jest.fn(),
    replace: jest.fn(),
  } as never);
  mockUseGuide.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  mockUsePlaylists.mockReturnValue({ data: [mockPlaylist] } as never);
  mockUseMemberships.mockReturnValue({ data: [] } as never);
  mockUseIsFavorite.mockReturnValue({ data: false } as never);
  mockUseToggleFavorite.mockReturnValue({ mutate: toggleFavorite } as never);
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
    fireEvent.press(screen.getByLabelText('Play Test Channel'));
    expect(onPress).toHaveBeenCalledWith(mockChannel);
  });

  it('opens the player when a channel card is pressed without a custom handler', () => {
    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByLabelText('Play Test Channel'));

    expect(navigateToPlayer).toHaveBeenCalledWith({
      pathname: '/player/[channelId]',
      params: { channelId: mockChannel.id },
    });
  });

  it('shows how many playlists contain the channel', () => {
    mockUseMemberships.mockReturnValue({ data: ['playlist-1', 'playlist-2'] } as never);
    render(<ChannelCard channel={mockChannel} />);
    expect(screen.getByTestId('channel-playlist-action').props.accessibilityLabel).toBe(
      'Add Test Channel to a playlist'
    );
  });

  it('toggles favorite accessibly without opening the player', () => {
    render(<ChannelCard channel={mockChannel} />);

    const favoriteAction = screen.getByTestId('channel-favorite-action');
    expect(favoriteAction.props.accessibilityLabel).toBe('Add Test Channel to favorites');
    expect(favoriteAction.props.accessibilityState.selected).toBe(false);
    fireEvent.press(favoriteAction);

    expect(toggleFavorite).toHaveBeenCalledWith({
      entityRef: { entityType: 'channel', entityId: mockChannel.id },
      isFavorite: false,
    });
    expect(navigateToPlayer).not.toHaveBeenCalled();
  });

  it('opens the playlist picker from the channel card', () => {
    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByTestId('channel-playlist-action'));
    expect(screen.getByText('Add to playlist')).toBeTruthy();
  });

  it('opens channel details without loading its guide', () => {
    render(<ChannelCard channel={mockChannel} />);
    expect(mockUseGuide).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('channel-details-action'));
    expect(screen.getByText('Channel details')).toBeTruthy();
    expect(mockUseGuide).not.toHaveBeenCalled();
  });

  it('opens the guide slider from the card and supports each date range', () => {
    render(<ChannelCard channel={mockChannel} />);
    expect(mockUseGuide).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('channel-guide-action'));
    expect(mockUseGuide).toHaveBeenCalledWith(mockChannel.id);
    expect(screen.getByText('Next 24 hours')).toBeTruthy();
    expect(screen.getByText('Past 3 days')).toBeTruthy();
    expect(screen.getByText('Next 7 days')).toBeTruthy();

    fireEvent.press(screen.getByTestId('guide-range-past'));
    expect(screen.getByTestId('guide-range-past').props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByTestId('guide-range-future'));
    expect(screen.getByTestId('guide-range-future').props.accessibilityState.selected).toBe(true);
  });

  it('highlights the live program and filters past and future schedules', () => {
    const now = Date.now();
    const entries: GuideEntry[] = [
      {
        channelId: mockChannel.id,
        title: 'Live program',
        description: null,
        start: new Date(now - 30 * 60 * 1000),
        end: new Date(now + 30 * 60 * 1000),
        icon: null,
      },
      {
        channelId: mockChannel.id,
        title: 'Past program',
        description: null,
        start: new Date(now - 24 * 60 * 60 * 1000),
        end: new Date(now - 23 * 60 * 60 * 1000),
        icon: null,
      },
      {
        channelId: mockChannel.id,
        title: 'Future program',
        description: null,
        start: new Date(now + 4 * 24 * 60 * 60 * 1000),
        end: new Date(now + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        icon: null,
      },
    ];
    mockUseGuide.mockReturnValue({
      data: entries,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    render(<ChannelCard channel={mockChannel} />);
    fireEvent.press(screen.getByTestId('channel-guide-action'));

    expect(screen.getByText('Live program')).toBeTruthy();
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
    expect(screen.queryByText('Past program')).toBeNull();

    fireEvent.press(screen.getByTestId('guide-range-past'));
    expect(screen.getByText('Past program')).toBeTruthy();
    expect(screen.queryByText('Live program')).toBeNull();

    fireEvent.press(screen.getByTestId('guide-range-future'));
    expect(screen.getByText('Future program')).toBeTruthy();
    expect(screen.queryByText('Past program')).toBeNull();
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
