// Export domain interfaces
export * from './repositories';

// Re-export concrete singletons from db container
export {
  db,
  settingsRepository,
  favoritesRepository,
  recentlyWatchedRepository,
  playlistRepository,
  profileRepository,
} from '../db';
