export type PlayerGestureAction =
  | { readonly type: 'seek'; readonly seconds: number }
  | { readonly type: 'volume'; readonly delta: number }
  | null;

export function getPlayerGestureAction(dx: number, dy: number): PlayerGestureAction {
  if (Math.max(Math.abs(dx), Math.abs(dy)) <= 18) return null;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { type: 'seek', seconds: dx > 0 ? 15 : -15 };
  }
  return { type: 'volume', delta: Math.max(-1, Math.min(1, -dy / 240)) };
}

export function getDoubleTapSeekSeconds(
  side: 'left' | 'right',
  elapsedSinceLastTap: number,
): number | null {
  if (elapsedSinceLastTap < 0 || elapsedSinceLastTap >= 320) return null;
  return side === 'left' ? -10 : 10;
}
