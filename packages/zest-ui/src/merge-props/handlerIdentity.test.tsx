import { mergeProps } from './mergeProps';

/**
 * A stable handler has to survive merging with its identity intact.
 *
 * Merging used to wrap every handler afresh on each call, so a component that
 * carefully kept its callback stable still handed the element a different
 * function every render. React Native does not care. `react-native-web` does:
 * its `Image` keys the effect that starts the load on
 * `onLoad`/`onLoadStart`/`onError`, so a new identity restarted the load, which
 * published a loading status, which rendered, which wrapped again — an infinite
 * loop that React ends with "Maximum update depth exceeded". `Avatar.Image` hit
 * it on every docs page it appeared on.
 */
describe('event handler identity through mergeProps', () => {
  it('is preserved for a stable handler with nothing to merge against', () => {
    const onLoad = () => {};

    const first = mergeProps<'div'>({ onLoad } as any, {} as any) as any;
    const second = mergeProps<'div'>({ onLoad } as any, {} as any) as any;

    expect(first.onLoad).toBe(second.onLoad);
  });

  it('is preserved when two stable handlers are chained', () => {
    const ours = () => {};
    const theirs = () => {};

    const first = mergeProps<'div'>({ onPress: ours } as any, { onPress: theirs } as any) as any;
    const second = mergeProps<'div'>({ onPress: ours } as any, { onPress: theirs } as any) as any;

    expect(first.onPress).toBe(second.onPress);
  });

  it('still gives a new function when either handler changes', () => {
    const ours = () => {};

    const first = mergeProps<'div'>({ onPress: ours } as any, { onPress: () => {} } as any) as any;
    const second = mergeProps<'div'>({ onPress: ours } as any, { onPress: () => {} } as any) as any;

    expect(first.onPress).not.toBe(second.onPress);
  });

  it('still calls both handlers, in order, when chained', () => {
    const calls: string[] = [];
    const ours = () => calls.push('ours');
    const theirs = () => calls.push('theirs');

    const merged = mergeProps<'div'>({ onPress: ours } as any, { onPress: theirs } as any) as any;
    merged.onPress();

    // The external handler runs first and can veto ours — caching must not
    // change that.
    expect(calls).toEqual(['theirs', 'ours']);
  });

  it('still calls a lone handler', () => {
    const calls: string[] = [];
    const onLoad = () => calls.push('loaded');

    const merged = mergeProps<'div'>({ onLoad } as any, {} as any) as any;
    merged.onLoad();

    expect(calls).toEqual(['loaded']);
  });
});
