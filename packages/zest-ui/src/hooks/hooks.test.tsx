import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { useForcedRerendering } from './useForcedRerendering';
import { useOnFirstRender } from './useOnFirstRender';
import { usePreviousValue } from './usePreviousValue';
import { useValueAsRef } from './useValueAsRef';

/**
 * These four hooks are part of the public `@limonify/zest-ui/hooks` surface but
 * are not used by any component in the library, so nothing else exercises them.
 */

describe('useForcedRerendering', () => {
  it('rerenders the component when the returned function is called', async () => {
    let renderCount = 0;
    let forceRerender: () => void = () => {};

    function Subject() {
      renderCount += 1;
      forceRerender = useForcedRerendering();
      return <Text>{renderCount}</Text>;
    }

    await render(<Subject />);
    expect(renderCount).toBe(1);

    await act(async () => {
      forceRerender();
    });

    expect(renderCount).toBe(2);
  });

  it('returns a stable function across renders', async () => {
    const seen = new Set<() => void>();

    function Subject(_props: { value: number }) {
      seen.add(useForcedRerendering());
      return null;
    }

    const view = await render(<Subject value={1} />);
    await view.rerender(<Subject value={2} />);

    expect(seen.size).toBe(1);
  });
});

describe('useOnFirstRender', () => {
  it('runs the callback once, during the first render', async () => {
    const fn = jest.fn();

    function Subject(_props: { value: number }) {
      useOnFirstRender(fn);
      return null;
    }

    const view = await render(<Subject value={1} />);
    expect(fn).toHaveBeenCalledTimes(1);

    await view.rerender(<Subject value={2} />);
    await view.rerender(<Subject value={3} />);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('usePreviousValue', () => {
  it('returns null on the first render, then the prior value', async () => {
    const seen: Array<string | null> = [];

    function Subject({ value }: { value: string }) {
      seen.push(usePreviousValue(value));
      return <Text testID="value">{value}</Text>;
    }

    const view = await render(<Subject value="a" />);
    expect(seen[0]).toBeNull();

    await view.rerender(<Subject value="b" />);
    expect(seen[seen.length - 1]).toBe('a');

    await view.rerender(<Subject value="c" />);
    expect(seen[seen.length - 1]).toBe('b');
    expect(screen.getByTestId('value')).toHaveTextContent('c');
  });

  it('keeps the previous value when rerendered with the same one', async () => {
    const seen: Array<number | null> = [];

    function Subject({ value }: { value: number }) {
      seen.push(usePreviousValue(value));
      return null;
    }

    const view = await render(<Subject value={1} />);
    await view.rerender(<Subject value={2} />);
    await view.rerender(<Subject value={2} />);

    expect(seen[seen.length - 1]).toBe(1);
  });
});

describe('useValueAsRef', () => {
  // The point of the hook: an effect can read the newest value without listing
  // it as a dependency, so it does not re-run when the value changes.
  it('exposes the committed value on `current` without re-running effects', async () => {
    const effect = jest.fn();
    let readInsideEffect: number | undefined;

    function Subject({ value }: { value: number }) {
      const valueRef = useValueAsRef(value);

      React.useEffect(() => {
        effect();
        readInsideEffect = valueRef.current;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    }

    const view = await render(<Subject value={1} />);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(readInsideEffect).toBe(1);

    await view.rerender(<Subject value={2} />);

    // The effect did not re-run, but the ref moved on.
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('tracks the latest value across renders', async () => {
    let latest: { current: number } | undefined;

    function Subject({ value }: { value: number }) {
      latest = useValueAsRef(value);
      return null;
    }

    const view = await render(<Subject value={1} />);
    expect(latest!.current).toBe(1);

    await view.rerender(<Subject value={2} />);
    expect(latest!.current).toBe(2);

    await view.rerender(<Subject value={3} />);
    expect(latest!.current).toBe(3);
  });
});
