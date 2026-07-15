import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Drawer } from '../index';
import type { DrawerRootProps } from '../root/DrawerRoot';

// jest-expo's window is 750x1334; snap points resolve against its height.
const VIEWPORT_HEIGHT = 1334;
const POPUP_HEIGHT = 600;

function TestDrawer(props: DrawerRootProps) {
  return (
    <GestureHandlerRootView>
      <Drawer.Root defaultOpen snapPoints={[0.25, 0.5]} {...props}>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup testID="popup" />
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </GestureHandlerRootView>
  );
}

/** Snap point offsets are all derived from the popup's measured height. */
async function layoutPopup(height: number = POPUP_HEIGHT) {
  await act(async () => {
    fireEvent(screen.getByTestId('popup'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 750, height } },
    });
  });
}

/** Drags the popup by `translationY` and releases it at `velocityY` px/s. */
async function swipe(translationY: number, velocityY: number = 0) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('popup'), [
      { state: State.BEGAN, translationX: 0, translationY: 0, velocityX: 0, velocityY: 0 },
      { state: State.ACTIVE, translationX: 0, translationY: translationY / 2, velocityX: 0, velocityY },
      { state: State.ACTIVE, translationX: 0, translationY, velocityX: 0, velocityY },
      { state: State.END, translationX: 0, translationY, velocityX: 0, velocityY },
    ]);
  });
}

/** Records the snap point state a style function saw on every render. */
function TestDrawerWithProbe(props: DrawerRootProps & { seen: unknown[] }) {
  const { seen, ...rootProps } = props;
  return (
    <GestureHandlerRootView>
      <Drawer.Root defaultOpen snapPoints={[0.25, 0.5]} {...rootProps}>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup
              testID="popup"
              style={(state) => {
                seen.push({ snapPoint: state.snapPoint, offset: state.snapPointOffset });
                return {};
              }}
            />
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </GestureHandlerRootView>
  );
}

describe('Drawer snap points', () => {
  it('starts at the first snap point', async () => {
    const seen: any[] = [];
    await render(<TestDrawerWithProbe seen={seen} />);
    await layoutPopup();

    // 0.25 * 1334 = 333.5 visible, so the popup is pushed down by the rest.
    expect(seen.at(-1)).toEqual({ snapPoint: 0.25, offset: POPUP_HEIGHT - 0.25 * VIEWPORT_HEIGHT });
  });

  it('honours defaultSnapPoint', async () => {
    const seen: any[] = [];
    await render(<TestDrawerWithProbe seen={seen} defaultSnapPoint={0.5} />);
    await layoutPopup();

    expect(seen.at(-1)?.snapPoint).toBe(0.5);
  });

  it('has no offset until the popup is measured', async () => {
    const seen: any[] = [];
    await render(<TestDrawerWithProbe seen={seen} />);

    expect(seen.at(-1)).toEqual({ snapPoint: 0.25, offset: null });
  });

  it('reports a null snap point when there are none', async () => {
    const seen: any[] = [];
    await render(
      <GestureHandlerRootView>
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup
                testID="popup"
                style={(state) => {
                  seen.push({ snapPoint: state.snapPoint, offset: state.snapPointOffset });
                  return {};
                }}
              />
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </GestureHandlerRootView>,
    );

    expect(seen.at(-1)).toEqual({ snapPoint: null, offset: null });
  });

  describe('snapping', () => {
    it('snaps up to the next point when dragged open', async () => {
      const onSnapPointChange = jest.fn();
      await render(<TestDrawer onSnapPointChange={onSnapPointChange} />);
      await layoutPopup();

      // From 0.25 (offset 266.5) upwards towards 0.5 (offset -66.5... clamped).
      await swipe(-200);

      expect(onSnapPointChange).toHaveBeenCalledWith(0.5, expect.objectContaining({ reason: 'swipe' }));
    });

    it('snaps back down to the lower point', async () => {
      const onSnapPointChange = jest.fn();
      await render(<TestDrawer defaultSnapPoint={0.5} onSnapPointChange={onSnapPointChange} />);
      await layoutPopup();

      await swipe(200);

      expect(onSnapPointChange).toHaveBeenCalledWith(0.25, expect.objectContaining({ reason: 'swipe' }));
    });

    it('stays put when the drag is too small to reach another point', async () => {
      const onSnapPointChange = jest.fn();
      await render(<TestDrawer onSnapPointChange={onSnapPointChange} />);
      await layoutPopup();

      await swipe(10);

      expect(onSnapPointChange).not.toHaveBeenCalled();
    });

    it('lets a fling skip past a snap point', async () => {
      const onSnapPointChange = jest.fn();
      await render(<TestDrawer snapPoints={[0.25, 0.5, 0.9]} onSnapPointChange={onSnapPointChange} />);
      await layoutPopup();

      // A small drag, but flung hard enough to project past 0.5 to 0.9.
      await swipe(-40, -4000);

      expect(onSnapPointChange).toHaveBeenCalledWith(0.9, expect.anything());
    });

    it('snapToSequentialPoints makes distance alone decide', async () => {
      const onSnapPointChange = jest.fn();
      await render(
        <TestDrawer snapPoints={[0.25, 0.5, 0.9]} snapToSequentialPoints onSnapPointChange={onSnapPointChange} />,
      );
      await layoutPopup();

      // The same hard fling now ignores velocity, so the drag lands nowhere new.
      await swipe(-40, -4000);

      expect(onSnapPointChange).not.toHaveBeenCalled();
    });

    it('lets onSnapPointChange cancel the change', async () => {
      const seen: any[] = [];
      const onSnapPointChange = jest.fn((_snapPoint, eventDetails) => eventDetails.cancel());
      await render(<TestDrawerWithProbe seen={seen} onSnapPointChange={onSnapPointChange} />);
      await layoutPopup();

      await swipe(-200);

      expect(onSnapPointChange).toHaveBeenCalled();
      expect(seen.at(-1)?.snapPoint).toBe(0.25);
    });

    it('follows a controlled snapPoint only when the consumer commits', async () => {
      const seen: any[] = [];
      const onSnapPointChange = jest.fn();
      await render(<TestDrawerWithProbe seen={seen} snapPoint={0.25} onSnapPointChange={onSnapPointChange} />);
      await layoutPopup();

      await swipe(-200);

      expect(onSnapPointChange).toHaveBeenCalledWith(0.5, expect.anything());
      expect(seen.at(-1)?.snapPoint).toBe(0.25);
    });
  });

  describe('dismissal', () => {
    it('closes when swiped past the most-closed snap point', async () => {
      const onOpenChange = jest.fn();
      await render(<TestDrawer onOpenChange={onOpenChange} />);
      await layoutPopup();

      // Far past the lowest snap point's offset plus the threshold.
      await swipe(600);

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'swipe' }));
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('snaps rather than dismisses when the drag stops short', async () => {
      const onOpenChange = jest.fn();
      await render(<TestDrawer defaultSnapPoint={0.5} onOpenChange={onOpenChange} />);
      await layoutPopup();

      await swipe(200);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });
  });
});
