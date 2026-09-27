import { getNextStreamIndex } from '@/features/player/stream-fallback';

describe('getNextStreamIndex', () => {
  it('returns the next alternate stream when one is available', () => {
    expect(getNextStreamIndex(0, 3)).toBe(1);
    expect(getNextStreamIndex(1, 3)).toBe(2);
  });

  it('returns null after the last stream or for an invalid index', () => {
    expect(getNextStreamIndex(2, 3)).toBeNull();
    expect(getNextStreamIndex(-1, 3)).toBeNull();
    expect(getNextStreamIndex(0, 0)).toBeNull();
  });
});
