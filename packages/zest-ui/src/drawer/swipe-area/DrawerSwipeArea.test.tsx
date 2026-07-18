import * as React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Drawer } from '../index';
import type { DrawerRootProps } from '../root/DrawerRoot';

function TestDrawer(props: DrawerRootProps & { areaProps?: Record<string, unknown> }) {
  const { areaProps, ...rootProps } = props;
  return (
    <GestureHandlerRootView>
      <Drawer.Root {...rootProps}>
        <Drawer.SwipeArea testID="area" {...areaProps} />
        <Drawer.Portal keepMounted>
          <Drawer.Viewport>
            <Drawer.Popup testID="popup" />
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </GestureHandlerRootView>
  );
}

/** Fires a pan on the swipe area, ending at `(translationX, translationY)`. */
async function swipe(
  gestureId: string,
  translationX: number,
  translationY: number,
) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId(gestureId), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: translationX / 2, translationY: translationY / 2 },
      { state: State.ACTIVE, translationX, translationY },
      { state: State.END, translationX, translationY },
    ]);
  });
}

describe('Drawer.SwipeArea', () => {
  it('renders and is hidden from assistive technology', async () => {
    await render(<TestDrawer />);
    const area = screen.getByTestId('area', { includeHiddenElements: true });
    expect(area.props['aria-hidden']).toBe(true);
    expect(area.props.accessibilityElementsHidden).toBe(true);
  });

  it('opens the drawer when swiped past the threshold', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDrawer onOpenChange={onOpenChange} />);

    // Default dismiss direction is 'down', so the drawer opens on a swipe 'up'
    // (negative translationY) past the 40px threshold.
    await swipe('area', 0, -100);

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('does not open on a swipe shorter than the threshold', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDrawer onOpenChange={onOpenChange} />);

    await swipe('area', 0, -10);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not open on a swipe in the wrong direction', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDrawer onOpenChange={onOpenChange} />);

    // Swiping down (the dismiss direction) must not open a closed drawer.
    await swipe('area', 0, 100);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('honours an explicit swipeDirection', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDrawer areaProps={{ swipeDirection: 'right' }} onOpenChange={onOpenChange} />);

    await swipe('area', 100, 0);

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('does nothing when disabled', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDrawer areaProps={{ disabled: true }} onOpenChange={onOpenChange} />);

    await swipe('area', 0, -100);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
