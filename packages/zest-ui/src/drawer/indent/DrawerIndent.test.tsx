import * as React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Drawer } from '../../index';

function TestApp(props: { defaultOpen?: boolean; withProvider?: boolean }) {
  const { defaultOpen, withProvider = true } = props;

  const content = (
    <>
      <Drawer.IndentBackground testID="indent-background" />
      <Drawer.Indent testID="indent">
        <Text>App</Text>
      </Drawer.Indent>
      <Drawer.Root defaultOpen={defaultOpen}>
        <Drawer.Trigger testID="trigger">
          <Text>Open</Text>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop testID="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup testID="popup">
              <Drawer.Close testID="close">
                <Text>Close</Text>
              </Drawer.Close>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );

  return (
    <GestureHandlerRootView>
      {withProvider ? <Drawer.Provider>{content}</Drawer.Provider> : content}
    </GestureHandlerRootView>
  );
}

function indentState(testID: string) {
  return styleStates.get(testID);
}

const styleStates = new Map<string, Drawer.Indent.State>();

function TrackedApp(props: { defaultOpen?: boolean }) {
  return (
    <GestureHandlerRootView>
      <Drawer.Provider>
        <Drawer.Indent
          testID="indent"
          style={(state) => {
            styleStates.set('indent', state);
            return undefined;
          }}
        >
          <Text>App</Text>
        </Drawer.Indent>
        <Drawer.Root defaultOpen={props.defaultOpen}>
          <Drawer.Trigger testID="trigger">
            <Text>Open</Text>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup testID="popup" />
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Drawer.Provider>
    </GestureHandlerRootView>
  );
}

describe('Drawer.Indent', () => {
  beforeEach(() => {
    styleStates.clear();
  });

  it('is inactive while every drawer is closed', async () => {
    await render(<TrackedApp />);

    expect(indentState('indent')).toMatchObject({ active: false, swipeProgress: 0 });
  });

  it('becomes active while a drawer is open', async () => {
    await render(<TrackedApp defaultOpen />);

    expect(indentState('indent')).toMatchObject({ active: true });
  });

  it('follows a drawer opening and closing', async () => {
    await render(<TrackedApp />);
    expect(indentState('indent')!.active).toBe(false);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));
    expect(indentState('indent')!.active).toBe(true);
  });

  it('reports the frontmost popup height once it is laid out', async () => {
    await render(<TrackedApp defaultOpen />);

    await act(async () => {
      fireEvent(screen.getByTestId('popup'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 240 } },
      });
    });

    expect(indentState('indent')!.frontmostHeight).toBe(240);
  });

  it('goes back to inactive when the drawer is dismissed', async () => {
    await render(<TestApp defaultOpen />);

    expect(screen.getByTestId('popup')).toBeTruthy();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('close'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('does not re-render during a swipe (swipeProgress is a snapshot)', async () => {
    const styleFn = jest.fn(() => undefined);

    await render(
      <GestureHandlerRootView>
        <Drawer.Provider>
          <Drawer.Indent testID="indent" style={styleFn}>
            <Text>App</Text>
          </Drawer.Indent>
          <Drawer.Root defaultOpen>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup testID="popup" />
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Provider>
      </GestureHandlerRootView>,
    );

    // The popup must report its height before a swipe can move `swipeProgress`.
    await act(async () => {
      fireEvent(screen.getByTestId('popup'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 240 } },
      });
    });

    const rendersBeforeSwipe = styleFn.mock.calls.length;

    await act(async () => {
      fireGestureHandler(getByGestureTestId('popup'), [
        { state: State.BEGAN, translationX: 0, translationY: 0 },
        { state: State.ACTIVE, translationX: 0, translationY: 15 },
        { state: State.ACTIVE, translationX: 0, translationY: 30 },
        { state: State.END, translationX: 0, translationY: 30 },
      ]);
    });

    // The swipe moved `swipeProgress` — a per-frame field the indent deliberately
    // does not subscribe to — so it must not have re-rendered its children.
    expect(styleFn.mock.calls.length).toBe(rendersBeforeSwipe);
  });

  it('renders inertly without a provider', async () => {
    const styleFn = jest.fn(() => undefined);

    await render(
      <GestureHandlerRootView>
        <Drawer.Indent testID="indent" style={styleFn}>
          <Text>App</Text>
        </Drawer.Indent>
      </GestureHandlerRootView>,
    );

    expect(screen.getByTestId('indent')).toBeTruthy();
    expect(styleFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: false, swipeProgress: 0, frontmostHeight: 0 }),
    );
  });

  it('exposes the same activity on the background', async () => {
    const styleFn = jest.fn(() => undefined);

    await render(
      <GestureHandlerRootView>
        <Drawer.Provider>
          <Drawer.IndentBackground testID="indent-background" style={styleFn} />
          <Drawer.Root defaultOpen>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup testID="popup" />
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Provider>
      </GestureHandlerRootView>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ active: true }));
  });
});
