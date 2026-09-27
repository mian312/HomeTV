import { shouldDismissAfterDrag } from '@/components/ui/slide-up-sheet';

describe('SlideUpSheet', () => {
  it('closes after a long or fast downward drag', () => {
    expect(shouldDismissAfterDrag(140, 0.2)).toBe(true);
    expect(shouldDismissAfterDrag(30, 1.1)).toBe(true);
    expect(shouldDismissAfterDrag(30, 0.2)).toBe(false);
  });
});
