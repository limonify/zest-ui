import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Select } from '../index';

/**
 * `isItemEqualToValue` is synced into the store, and every item subscribes to it.
 * A comparer written inline is a new function on every render, so the store is
 * written whenever the consumer's component renders and the items render a
 * second time with it — once as its JSX children, once for the store.
 *
 * Memoizing the comparer removes that second pass. zest cannot do it for you:
 * stabilizing the identity internally would mean either calling
 * `useStableCallback` (which throws when called during render, and comparing is
 * render work) or writing a ref during render (which React may replay or
 * discard). So the guidance is the consumer's, and these pin down what each
 * choice actually costs.
 */
function renderCounter() {
  const renders = jest.fn();
  return {
    renders,
    style: () => {
      renders();
      return undefined;
    },
  };
}

function TestSelect(props: { comparer: (a: any, b: any) => boolean; style: () => undefined }) {
  return (
    <>
      <Select.Root defaultOpen isItemEqualToValue={props.comparer}>
        <Select.Trigger testID="trigger" />
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Select.Item value={{ id: 1 }} style={props.style} />
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </>
  );
}

async function rendersPerParentRender(node: React.ReactElement, renders: jest.Mock) {
  await render(node);
  const before = renders.mock.calls.length;

  await act(async () => {
    screen.getByTestId('force').props.onPress();
  });

  return renders.mock.calls.length - before;
}

const byId = (a: any, b: any) => a.id === b.id;

describe('isItemEqualToValue identity', () => {
  it('costs an extra item render when written inline', async () => {
    const { renders, style } = renderCounter();

    function App() {
      const [, force] = React.useState(0);
      return (
        <>
          <Text testID="force" onPress={() => force((n) => n + 1)}>
            force
          </Text>
          {/* A new function every render — the shape the docs show for brevity. */}
          <TestSelect comparer={(a, b) => a.id === b.id} style={style} />
        </>
      );
    }

    expect(await rendersPerParentRender(<App />, renders)).toBe(2);
  });

  it('costs one when it is stable', async () => {
    const { renders, style } = renderCounter();

    function App() {
      const [, force] = React.useState(0);
      return (
        <>
          <Text testID="force" onPress={() => force((n) => n + 1)}>
            force
          </Text>
          <TestSelect comparer={byId} style={style} />
        </>
      );
    }

    expect(await rendersPerParentRender(<App />, renders)).toBe(1);
  });

  it('always compares with the comparer most recently passed', async () => {
    function App(props: { byId: boolean }) {
      return (
        <Select.Root defaultOpen defaultValue={{ id: 1 }} isItemEqualToValue={
          props.byId ? byId : () => false
        }>
          <Select.Trigger testID="trigger" />
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Select.Item testID="item" value={{ id: 1 }} />
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    const view = await render(<App byId={false} />);
    expect(screen.getByTestId('item').props.accessibilityState.selected).toBe(false);

    // Swapping the comparer's behaviour propagates — the extra render pass is
    // what buys this, which is why zest does not freeze the identity for you.
    await view.rerender(<App byId />);
    expect(screen.getByTestId('item').props.accessibilityState.selected).toBe(true);
  });
});
