export function getNextStreamIndex(currentIndex: number, streamCount: number): number | null {
  const nextIndex = currentIndex + 1;
  return currentIndex >= 0 && nextIndex < streamCount ? nextIndex : null;
}
