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
  const sections: HomeSectionDescriptor[] = [];
  const userOrder = model.preferredHomeSections;

  // Track what we've added to prevent duplicates
  const added = new Set<string>();

  const add = (descriptor: HomeSectionDescriptor) => {
    const key = descriptor.type === 'category' ? `cat-${descriptor.categoryId}`
      : descriptor.type === 'country' ? `country-${descriptor.countryCode}`
      : descriptor.type === 'language' ? `lang-${descriptor.languageCode}`
      : descriptor.type;
    
    if (!added.has(key)) {
      sections.push(descriptor);
      added.add(key);
    }
  };

  // 1. User's chosen sections in their chosen order
  for (const sectionId of userOrder) {
    if (sectionId === 'recently-watched') {
      add({ type: 'recently-watched' });
    } else if (sectionId === 'favorites') {
      add({ type: 'favorites' });
    } else if (sectionId === 'recommended') {
      add({ type: 'recommended' });
    } else if (sectionId === 'categories') {
      // Expand categories, bounded to 3 max to prevent giant lists
      const cats = Array.from(model.preferredCategories).slice(0, 3);
      for (const cat of cats) {
        add({ type: 'category', categoryId: cat });
      }
    } else if (sectionId === 'countries') {
      const countries = Array.from(model.preferredCountries).slice(0, 2);
      for (const country of countries) {
        add({ type: 'country', countryCode: country });
      }
    } else if (sectionId === 'languages') {
      const langs = Array.from(model.preferredLanguages).slice(0, 2);
      for (const lang of langs) {
        add({ type: 'language', languageCode: lang });
      }
    }
  }

  // 2. Default fallback if not defined in user order
  const defaultRemainingOrder: HomeSectionDescriptor[] = [
    { type: 'recently-watched' },
    { type: 'favorites' },
    { type: 'recommended' }
  ];
  
  for (const def of defaultRemainingOrder) {
    add(def);
  }

  // Expand remaining preferences up to limits if they weren't explicitly added
  if (!userOrder.includes('categories')) {
    Array.from(model.preferredCategories).slice(0, 3).forEach(c => add({ type: 'category', categoryId: c }));
  }

  return sections;
}
