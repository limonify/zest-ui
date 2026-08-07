import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Select } from '../index';

/**
 * `isItemEqualToValue` is synced into the store, so a comparer written inline is
 * a new function on every render and the store is written every time the
 * consumer's component renders.
 *
 * That used to cost every item a second render. It no longer does: items
 * subscribe to the *boolean* `isSelected(itemValue)`, and a comparer whose
 * identity changed but whose answer did not leaves that boolean alone, so
 * `useSyncExternalStore` bails out. Memoizing the comparer is still tidier, but
 * it is no longer load-bearing — and these pin that down so it stays true.
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
  it('costs no extra item render when written inline', async () => {
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

    // One render, for the parent's own — the store write the new identity causes
    // does not reach the item, because the boolean it selects is unchanged.
    expect(await rendersPerParentRender(<App />, renders)).toBe(1);
  });

  it('costs the same when it is stable', async () => {
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
