import type { PersonalizationModel } from './model';

export type HomeSectionDescriptor =
  | { type: 'recently-watched' }
  | { type: 'favorites' }
  | { type: 'recommended' }
  | { type: 'category'; categoryId: string }
  | { type: 'country'; countryCode: string }
  | { type: 'language'; languageCode: string };

/**
 * Resolves the personalization model into a list of section descriptors to render
 * on the Home screen. This applies ordering based on preferences and limits
 * generated sections to keep render costs predictable.
 */
export function resolveHomeSections(model: PersonalizationModel): HomeSectionDescriptor[] {
  const sections: HomeSectionDescriptor[] = [
    { type: 'recently-watched' },
    { type: 'favorites' },
    { type: 'recommended' }
  ];

  // Then all categories, not some sliced ones
  const cats = Array.from(model.preferredCategories);
  for (const cat of cats) {
    sections.push({ type: 'category', categoryId: cat });
  }

  return sections;
}
