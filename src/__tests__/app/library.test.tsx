import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import LibraryScreen from '@/app/(tabs)/library';
import { useChannels } from '@/data/queries/iptv';
import {
    useChannelPlaylistMemberships,
    useCreatePlaylist,
    useFavorites,
    useIsFavorite,
    usePlaylistItems,
    usePlaylistSummaries,
    usePlaylists,
    useRecentlyWatched,
    useRemovePlaylistItem,
    useToggleFavorite,
    useAddPlaylistItem,
} from '@/data/queries/local';
import type { Channel, Playlist, PlaylistItem } from '@/types/domain';

jest.mock('@/data/queries/iptv', () => ({ useChannels: jest.fn() }));
jest.mock('@/data/queries/local', () => ({
  useChannelPlaylistMemberships: jest.fn(),
  useCreatePlaylist: jest.fn(),
  useFavorites: jest.fn(),
  useIsFavorite: jest.fn(),
  usePlaylistItems: jest.fn(),
  usePlaylistSummaries: jest.fn(),
  usePlaylists: jest.fn(),
  useRecentlyWatched: jest.fn(),
  useRemovePlaylistItem: jest.fn(),
  useToggleFavorite: jest.fn(),
  useAddPlaylistItem: jest.fn(),
}));

const channel: Channel = {
  id: 'channel-1' as Channel['id'],
  name: 'Test Channel',
  altNames: [],
  network: null,
  country: 'US' as Channel['country'],
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
const playlist: Playlist = {
  id: 'playlist-1',
  name: 'Evening',
  createdAt: new Date(0),
  updatedAt: new Date(0),
};
const playlistItem: PlaylistItem = {
  playlistId: playlist.id,
  entityRef: { entityType: 'channel', entityId: channel.id },
  position: 0,
  addedAt: new Date(0),
};

const mockUseRouter = jest.mocked(useRouter);
const mockUseChannels = jest.mocked(useChannels);
const mockUseCreatePlaylist = jest.mocked(useCreatePlaylist);
const mockUseFavorites = jest.mocked(useFavorites);
const mockUseIsFavorite = jest.mocked(useIsFavorite);
const mockUseChannelPlaylistMemberships = jest.mocked(useChannelPlaylistMemberships);
const mockUsePlaylistItems = jest.mocked(usePlaylistItems);
const mockUsePlaylistSummaries = jest.mocked(usePlaylistSummaries);
const mockUsePlaylists = jest.mocked(usePlaylists);
const mockUseRecentlyWatched = jest.mocked(useRecentlyWatched);
const mockUseRemovePlaylistItem = jest.mocked(useRemovePlaylistItem);
const mockUseToggleFavorite = jest.mocked(useToggleFavorite);
const mockUseAddPlaylistItem = jest.mocked(useAddPlaylistItem);
const navigate = jest.fn();
const removePlaylistItem = jest.fn();
const createPlaylist = jest.fn();
const refetchChannels = jest.fn();

function setLoadedLibraryState() {
  mockUseChannels.mockReturnValue({
    data: [channel],
    isLoading: false,
    isError: false,
    refetch: refetchChannels,
  } as never);
  mockUseFavorites.mockReturnValue({ data: [] } as never);
  mockUseIsFavorite.mockReturnValue({ data: false } as never);
  mockUseChannelPlaylistMemberships.mockReturnValue({ data: [] } as never);
  mockUseRecentlyWatched.mockReturnValue({ data: [] } as never);
  mockUsePlaylists.mockReturnValue({ data: [playlist] } as never);
  mockUsePlaylistSummaries.mockReturnValue({
    data: [{ playlistId: playlist.id, channelCount: 1, previewChannelIds: [channel.id] }],
  } as never);
  mockUsePlaylistItems.mockReturnValue({ data: [playlistItem], isLoading: false } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: navigate, back: jest.fn(), replace: jest.fn() } as never);
  setLoadedLibraryState();
  mockUseCreatePlaylist.mockReturnValue({ mutateAsync: createPlaylist, isPending: false } as never);
  mockUseRemovePlaylistItem.mockReturnValue({ mutate: removePlaylistItem } as never);
  mockUseToggleFavorite.mockReturnValue({ mutate: jest.fn() } as never);
  mockUseAddPlaylistItem.mockReturnValue({ mutate: jest.fn() } as never);
});

describe('LibraryScreen', () => {
  it('opens a playlist channel in the player and keeps its remove action separate', () => {
    render(<LibraryScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Open Evening, 1 channels' }));

    fireEvent.press(screen.getByRole('button', { name: 'Play Test Channel' }));
    expect(navigate).toHaveBeenCalledWith({
      pathname: '/player/[channelId]',
      params: { channelId: channel.id },
    });

    fireEvent.press(screen.getByRole('button', { name: 'Remove Test Channel from playlist' }));
    expect(removePlaylistItem).toHaveBeenCalledWith({
      playlistId: playlist.id,
      entityRef: { entityType: 'channel', entityId: channel.id },
    });
  });

  it('shows catalog retry instead of an empty library when saved channels cannot hydrate', () => {
    mockUseChannels.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchChannels,
    } as never);

    render(<LibraryScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Saved channels are unavailable right now.')).toBeTruthy();
    expect(refetchChannels).toHaveBeenCalledTimes(1);
  });

  it('hydrates persisted favorites and recently watched channels from the catalog', () => {
    mockUseFavorites.mockReturnValue({
      data: [{ entityRef: { entityType: 'channel', entityId: channel.id }, createdAt: new Date(0) }],
    } as never);
    mockUseRecentlyWatched.mockReturnValue({
      data: [{ entityRef: { entityType: 'channel', entityId: channel.id }, watchedAt: new Date(0) }],
    } as never);

    render(<LibraryScreen />);

    expect(screen.getByText('Recently Watched')).toBeTruthy();
    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getAllByText('Test Channel')).toHaveLength(2);
  });
});