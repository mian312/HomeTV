import type { Channel } from '@/types/domain';
import type { PersonalizationModel } from './model';

export interface ChannelScore {
  score: number;
  reasons: string[];
}

export function scoreChannel(channel: Channel, model: PersonalizationModel): ChannelScore {
  let score = 0;
  const reasons: string[] = [];

  if (model.favorites.has(channel.id)) {
    score += 100;
    reasons.push('favorite');
  }

  if (model.recentChannels.includes(channel.id)) {
    score += 50;
    reasons.push('recent');
  }

  if (channel.country && model.preferredCountries.has(channel.country)) {
    score += 20;
    reasons.push('preferred_country');
  }

  let languageMatch = false;
  for (const lang of channel.languages) {
    if (model.preferredLanguages.has(lang)) {
      languageMatch = true;
      break;
    }
  }
  if (languageMatch) {
    score += 20;
    reasons.push('preferred_language');
  }

  let categoryMatch = false;
  for (const cat of channel.categories) {
    if (model.preferredCategories.has(cat)) {
      categoryMatch = true;
      break;
    }
  }
  if (categoryMatch) {
    score += 20;
    reasons.push('preferred_category');
  }

  return { score, reasons };
}

export function sortChannelsByScore(channels: readonly Channel[], model: PersonalizationModel): Channel[] {
  const scored = channels.map(c => ({ channel: c, scoreInfo: scoreChannel(c, model) }));
  scored.sort((a, b) => {
    // Primary sort: descending by score
    if (b.scoreInfo.score !== a.scoreInfo.score) {
      return b.scoreInfo.score - a.scoreInfo.score;
    }
    // Secondary sort: ascending by name
    return a.channel.name.localeCompare(b.channel.name);
  });
  return scored.map(s => s.channel);
}
