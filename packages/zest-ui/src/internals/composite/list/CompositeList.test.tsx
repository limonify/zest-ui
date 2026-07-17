import * as React from 'react';
import { Text, View, type LayoutRectangle } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CompositeList } from './CompositeList';
import { useCompositeListItem } from './useCompositeListItem';

function Item({ label }: { label: string }) {
  const { index, onLayout } = useCompositeListItem<{ label: string }>({
    metadata: React.useMemo(() => ({ label }), [label]),
  });

  return (
    <View testID={label} onLayout={onLayout}>
      <Text>{`${label}:${index}`}</Text>
    </View>
  );
}

async function layout(testID: string, rect: Partial<LayoutRectangle>) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 10, height: 10, ...rect } },
    });
  });
}

describe('CompositeList', () => {
  it('indexes items by registration order before anything is measured', async () => {
    await render(
      <CompositeList>
        <Item label="a" />
        <Item label="b" />
        <Item label="c" />
      </CompositeList>,
    );

    expect(screen.getByText('a:0')).toBeTruthy();
    expect(screen.getByText('b:1')).toBeTruthy();
    expect(screen.getByText('c:2')).toBeTruthy();
  });

  it('sorts a horizontal row left to right once every item is measured', async () => {
    await render(
      <CompositeList>
        <Item label="a" />
        <Item label="b" />
        <Item label="c" />
      </CompositeList>,
    );

    // Reported out of registration order, as `row-reverse` would.
    await layout('a', { x: 200 });
    await layout('b', { x: 100 });
    await layout('c', { x: 0 });

    expect(screen.getByText('c:0')).toBeTruthy();
    expect(screen.getByText('b:1')).toBeTruthy();
    expect(screen.getByText('a:2')).toBeTruthy();
  });

  it('keeps registration order until every item has been measured', async () => {
    await render(
      <CompositeList>
        <Item label="a" />
        <Item label="b" />
      </CompositeList>,
    );

    // Only one item measured: mixing the two orderings would not be transitive,
    // so the list stays on registration order.
    await layout('a', { x: 200 });

    expect(screen.getByText('a:0')).toBeTruthy();
    expect(screen.getByText('b:1')).toBeTruthy();
  });

  it('sorts a vertical list top to bottom', async () => {
    await render(
      <CompositeList>
        <Item label="a" />
        <Item label="b" />
      </CompositeList>,
    );

    await layout('a', { y: 50, height: 20 });
    await layout('b', { y: 0, height: 20 });

    expect(screen.getByText('b:0')).toBeTruthy();
    expect(screen.getByText('a:1')).toBeTruthy();
  });

  it('treats items whose vertical extents overlap as one row', async () => {
    await render(
      <CompositeList>
        <Item label="tall" />
        <Item label="short" />
      </CompositeList>,
    );

    // A taller item next to a centered shorter one: different `y`, same row.
    await layout('tall', { x: 100, y: 0, height: 40 });
    await layout('short', { x: 0, y: 10, height: 20 });

    // Sorted by x, not by y.
    expect(screen.getByText('short:0')).toBeTruthy();
    expect(screen.getByText('tall:1')).toBeTruthy();
  });

  it('orders wrapped rows in reading order', async () => {
    await render(
      <CompositeList>
        <Item label="a" />
        <Item label="b" />
        <Item label="c" />
      </CompositeList>,
    );

    await layout('a', { x: 0, y: 0, height: 10 });
    await layout('b', { x: 0, y: 20, height: 10 });
    await layout('c', { x: 50, y: 0, height: 10 });

    // First row left to right, then the second row.
    expect(screen.getByText('a:0')).toBeTruthy();
    expect(screen.getByText('c:1')).toBeTruthy();
    expect(screen.getByText('b:2')).toBeTruthy();
  });

  it('reindexes after children are reordered without remounting', async () => {
    const view = await render(
      <CompositeList>
        <Item key="a" label="a" />
        <Item key="b" label="b" />
      </CompositeList>,
    );

    await layout('a', { x: 0 });
    await layout('b', { x: 100 });
    expect(screen.getByText('a:0')).toBeTruthy();

    // Keys are preserved, so React moves the instances instead of remounting:
    // no effect re-runs and registration order goes stale. Only the new layout
    // reveals the swap — this is what the web version's MutationObserver catches.
    await view.rerender(
      <CompositeList>
        <Item key="b" label="b" />
        <Item key="a" label="a" />
      </CompositeList>,
    );
    await layout('a', { x: 100 });
    await layout('b', { x: 0 });

    expect(screen.getByText('b:0')).toBeTruthy();
    expect(screen.getByText('a:1')).toBeTruthy();
  });

  it('reindexes when an item unmounts', async () => {
    const view = await render(
      <CompositeList>
        <Item label="a" />
        <Item label="b" />
        <Item label="c" />
      </CompositeList>,
    );

    expect(screen.getByText('c:2')).toBeTruthy();

    await view.rerender(
      <CompositeList>
        <Item label="a" />
        <Item label="c" />
      </CompositeList>,
    );

    expect(screen.getByText('a:0')).toBeTruthy();
    expect(screen.getByText('c:1')).toBeTruthy();
  });

  it('reports the sorted map with metadata and layout through onMapChange', async () => {
    const onMapChange = jest.fn();
    await render(
      <CompositeList<{ label: string }> onMapChange={onMapChange}>
        <Item label="a" />
      </CompositeList>,
    );

    await layout('a', { x: 5, y: 6, width: 7, height: 8 });

    const lastMap = onMapChange.mock.calls.at(-1)![0];
    expect(Array.from(lastMap.values())).toEqual([
      { label: 'a', index: 0, layout: { x: 5, y: 6, width: 7, height: 8 } },
    ]);
  });
});
