import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { ReactStore } from './ReactStore';
import { createSelector } from './createSelector';
import { useRefWithInit } from '../hooks/useRefWithInit';

type TestState = { value: number; label: string };

const selectors = {
  value: createSelector((state: TestState) => state.value),
  label: createSelector((state: TestState) => state.label),
};

function useStableStore<State extends object>(initial: State) {
  return useRefWithInit(() => new ReactStore<State>(initial)).current;
}

describe('Store', () => {
  it('notifies subscribers on setState and set', () => {
    const store = new ReactStore<TestState>({ value: 0, label: '' });
    const listener = jest.fn();
    store.subscribe(listener);

    store.set('value', 1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.state.value).toBe(1);

    // Same value → no notification
    store.set('value', 1);
    expect(listener).toHaveBeenCalledTimes(1);

    store.update({ value: 2, label: 'x' });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.state).toEqual({ value: 2, label: 'x' });
  });
});

describe('ReactStore', () => {
  it('syncs internal state from controlled prop', async () => {
    let store!: ReactStore<TestState>;

    function Test({ controlled }: { controlled: number | undefined }) {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', controlled);
      return null;
    }

    const view = await render(<Test controlled={1} />);
    expect(store.state.value).toBe(1);

    await view.rerender(<Test controlled={5} />);
    expect(store.state.value).toBe(5);
  });

  it('useState subscribes to a selector slice and re-renders on change', async () => {
    let store!: ReactStore<TestState, {}, typeof selectors>;
    let renders = 0;

    function Value() {
      renders += 1;
      const value = store.useState('value');
      return <Text>{`value:${value}`}</Text>;
    }

    function Test() {
      store = useRefWithInit(
        () => new ReactStore<TestState, {}, typeof selectors>({ value: 0, label: '' }, {}, selectors),
      ).current;
      return <Value />;
    }

    await render(<Test />);
    expect(screen.getByText('value:0')).toBeTruthy();
    const rendersBefore = renders;

    await act(async () => {
      store.set('value', 7);
    });
    expect(screen.getByText('value:7')).toBeTruthy();

    // Changing an unrelated slice must not re-render the subscriber.
    const rendersAfterValue = renders;
    expect(rendersAfterValue).toBeGreaterThan(rendersBefore);
    await act(async () => {
      store.set('label', 'unrelated');
    });
    expect(renders).toBe(rendersAfterValue);
  });

  it('useSyncedValueWithCleanup sets the value and clears it on unmount', async () => {
    type State = { id: string | undefined };
    const store = new ReactStore<State>({ id: undefined });

    function Test({ id }: { id: string }) {
      store.useSyncedValueWithCleanup('id', id);
      return null;
    }

    const view = await render(<Test id="abc" />);
    expect(store.state.id).toBe('abc');

    await view.unmount();
    expect(store.state.id).toBeUndefined();
  });

  it('useContextCallback keeps a stable reference that calls the latest callback', async () => {
    type Context = { onChange: ((value: number) => void) | undefined };
    let store!: ReactStore<TestState, Context>;

    function Test({ onChange }: { onChange: (value: number) => void }) {
      store = useRefWithInit(
        () => new ReactStore<TestState, Context>({ value: 0, label: '' }, { onChange: undefined }),
      ).current;
      store.useContextCallback('onChange', onChange);
      return null;
    }

    const first = jest.fn();
    const second = jest.fn();

    const view = await render(<Test onChange={first} />);
    const stableRef = store.context.onChange;

    await view.rerender(<Test onChange={second} />);
    expect(store.context.onChange).toBe(stableRef);

    await act(async () => {
      store.context.onChange?.(42);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(42);
  });

  it('observe calls the listener immediately and on selected changes only', () => {
    const store = new ReactStore<TestState, {}, typeof selectors>(
      { value: 0, label: '' },
      {},
      selectors,
    );
    const listener = jest.fn();

    const unsubscribe = store.observe('value', listener);
    expect(listener).toHaveBeenCalledWith(0, 0, store);

    store.set('value', 3);
    expect(listener).toHaveBeenCalledWith(3, 0, store);
    expect(listener).toHaveBeenCalledTimes(2);

    store.set('label', 'nope');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.set('value', 9);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
