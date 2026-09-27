import { getDoubleTapSeekSeconds, getPlayerGestureAction } from '@/features/player/player-gestures';

describe('player gestures', () => {
  it('maps horizontal swipes to forward and backward seeking', () => {
    expect(getPlayerGestureAction(80, 10)).toEqual({ type: 'seek', seconds: 15 });
    expect(getPlayerGestureAction(-80, 10)).toEqual({ type: 'seek', seconds: -15 });
  });

  it('maps vertical swipes to bounded volume changes', () => {
    expect(getPlayerGestureAction(4, -120)).toEqual({ type: 'volume', delta: 0.5 });
    expect(getPlayerGestureAction(4, 600)).toEqual({ type: 'volume', delta: -1 });
  });

  it('seeks on left and right double taps only within the interval', () => {
    expect(getDoubleTapSeekSeconds('left', 250)).toBe(-10);
    expect(getDoubleTapSeekSeconds('right', 250)).toBe(10);
    expect(getDoubleTapSeekSeconds('right', 400)).toBeNull();
  });
});
