import * as React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toast, createToastManager } from '../index';

/**
 * The viewport learns its screen origin through `measureInWindow`, which the RN
 * test host does not implement — so each test decides where the viewport sits.
 */
function mockViewportOrigin(x: number, y: number) {
  return jest
    .spyOn(View.prototype, 'measureInWindow')
    .mockImplementation((callback: (x: number, y: number, w: number, h: number) => void) => {
      callback(x, y, 0, 0);
    });
}

async function layoutViewport() {
  await act(async () => {
    fireEvent(screen.getByTestId('viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
    });
  });
}

function TestAnchoredToast() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport testID="viewport">
      {toasts.map((toast) => (
        <Toast.Positioner key={toast.id} testID="positioner" side="top">
          <Toast.Root toast={toast} testID="toast">
            <Toast.Title testID="title" />
            <Toast.Arrow testID="arrow" />
          </Toast.Root>
        </Toast.Positioner>
      ))}
    </Toast.Viewport>
  );
}

function positionerStyle() {
  return screen.getByTestId('positioner').props.style;
}

describe('Toast.Positioner', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws when Toast.Arrow is used outside a Positioner', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      render(
        <Toast.Provider>
          <Toast.Arrow />
        </Toast.Provider>,
      ),
    ).rejects.toThrow(/must be placed within <Toast.Positioner>/);

    error.mockRestore();
  });

  it('renders an anchored toast with its arrow', async () => {
    mockViewportOrigin(0, 0);
    const manager = createToastManager();
    await render(
      <GestureHandlerRootView>
        <Toast.Provider toastManager={manager} timeout={0}>
          <TestAnchoredToast />
        </Toast.Provider>
      </GestureHandlerRootView>,
    );

    await act(async () => {
      manager.add({ title: 'Anchored' });
    });

    expect(screen.getByTestId('positioner')).toBeTruthy();
    expect(screen.getByTestId('title')).toHaveTextContent('Anchored');
    expect(screen.getByTestId('arrow', { includeHiddenElements: true })).toBeTruthy();
  });

  it('positions absolutely', async () => {
    mockViewportOrigin(0, 0);
    const manager = createToastManager();
    await render(
      <GestureHandlerRootView>
        <Toast.Provider toastManager={manager} timeout={0}>
          <TestAnchoredToast />
        </Toast.Provider>
      </GestureHandlerRootView>,
    );
    await act(async () => {
      manager.add({ title: 'Anchored' });
    });

    expect(positionerStyle()).toMatchObject({ position: 'absolute' });
  });

  describe('the viewport origin correction', () => {
    it('leaves screen coordinates alone when the viewport is at the screen origin', async () => {
      mockViewportOrigin(0, 0);
      const manager = createToastManager();
      await render(
        <GestureHandlerRootView>
          <Toast.Provider toastManager={manager} timeout={0}>
            <TestAnchoredToast />
          </Toast.Provider>
        </GestureHandlerRootView>,
      );
      await act(async () => {
        manager.add({ title: 'Anchored' });
      });
      await layoutViewport();

      const { left, top } = positionerStyle();
      expect(left).toBe(0);
      expect(top).toBe(0);
    });

    it('subtracts the viewport origin when the viewport is offset', async () => {
      // A viewport inside a SafeAreaView, say: its own top-left is not the
      // screen's, but the anchor was measured against the screen.
      mockViewportOrigin(30, 100);
      const manager = createToastManager();
      await render(
        <GestureHandlerRootView>
          <Toast.Provider toastManager={manager} timeout={0}>
            <TestAnchoredToast />
          </Toast.Provider>
        </GestureHandlerRootView>,
      );
      await act(async () => {
        manager.add({ title: 'Anchored' });
      });
      await layoutViewport();

      // Without the correction the toast would be pushed 30/100 px past its
      // anchor, since these coordinates are relative to the viewport.
      const { left, top } = positionerStyle();
      expect(left).toBe(-30);
      expect(top).toBe(-100);
    });

    it('follows the viewport when it moves', async () => {
      const spy = mockViewportOrigin(0, 0);
      const manager = createToastManager();
      await render(
        <GestureHandlerRootView>
          <Toast.Provider toastManager={manager} timeout={0}>
            <TestAnchoredToast />
          </Toast.Provider>
        </GestureHandlerRootView>,
      );
      await act(async () => {
        manager.add({ title: 'Anchored' });
      });
      await layoutViewport();
      expect(positionerStyle().top).toBe(0);

      spy.mockImplementation((callback: (x: number, y: number, w: number, h: number) => void) => {
        callback(0, 60, 0, 0);
      });
      await layoutViewport();

      expect(positionerStyle().top).toBe(-60);
    });
  });

  it('publishes the resolved side to a style function', async () => {
    mockViewportOrigin(0, 0);
    const seen: string[] = [];
    const manager = createToastManager();

    await render(
      <GestureHandlerRootView>
        <Toast.Provider toastManager={manager} timeout={0}>
          <ToastListWithProbe seen={seen} />
        </Toast.Provider>
      </GestureHandlerRootView>,
    );
    await act(async () => {
      manager.add({ title: 'Anchored' });
    });

    expect(seen.at(-1)).toBe('top');
  });
});

function ToastListWithProbe({ seen }: { seen: string[] }) {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport testID="viewport">
      {toasts.map((toast) => (
        <Toast.Positioner
          key={toast.id}
          testID="positioner"
          side="top"
          style={(state) => {
            seen.push(state.side);
            return {};
          }}
        >
          <Toast.Root toast={toast} testID="toast">
            <Text>Anchored</Text>
          </Toast.Root>
        </Toast.Positioner>
      ))}
    </Toast.Viewport>
  );
}
