import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Drawer } from '../index';
import type { DrawerRootProps } from './DrawerRoot';

function TestDrawer({ swipeThreshold, ...rootProps }: DrawerRootProps & { swipeThreshold?: number }) {
  return (
    <GestureHandlerRootView>
      <Drawer.Root {...rootProps}>
        <Drawer.Trigger testID="trigger">
          <Text>Open</Text>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop testID="backdrop" />
          <Drawer.Viewport testID="viewport">
            <Drawer.Popup testID="popup" swipeThreshold={swipeThreshold}>
              <Drawer.Title>Drawer Title</Drawer.Title>
              <Drawer.Description>Drawer description.</Drawer.Description>
              <Drawer.Close testID="close">
                <Text>Close</Text>
              </Drawer.Close>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </GestureHandlerRootView>
  );
}

/**
 * Swipes the popup by `translation` pixels along both axes and releases.
 *
 * Every position is sent as an explicit ACTIVE event: any state transition
 * `fireGestureHandler` has to synthesize arrives with its translation defaulted
 * to 0, which would read as a swipe that never moved.
 */
async function swipe(x: number, y: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('popup'), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: x / 2, translationY: y / 2 },
      { state: State.ACTIVE, translationX: x, translationY: y },
      { state: State.END, translationX: x, translationY: y },
    ]);
  });
}

describe('Drawer', () => {
  it('opens from the trigger and closes from the close button', async () => {
    const user = userEvent.setup();
    await render(<TestDrawer />);

    expect(screen.queryByTestId('popup')).toBeNull();

    await user.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('popup')).toBeTruthy();

    await user.press(screen.getByTestId('close'));
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('throws when a part is used outside Drawer.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Drawer.Popup />)).rejects.toThrow(/DrawerRootContext is missing/);

    error.mockRestore();
  });

  describe('swipe dismissal', () => {
    it('closes on a swipe past the threshold, with the swipe reason', async () => {
      const onOpenChange = jest.fn();
      await render(<TestDrawer defaultOpen onOpenChange={onOpenChange} />);

      await swipe(0, 100);

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'swipe' }));
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('stays open when the swipe does not reach the threshold', async () => {
      const onOpenChange = jest.fn();
      await render(<TestDrawer defaultOpen onOpenChange={onOpenChange} />);

      await swipe(0, 20);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('honours a custom swipeThreshold', async () => {
      await render(<TestDrawer defaultOpen swipeThreshold={200} />);

      await swipe(0, 100);

      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('ignores a swipe against the dismiss direction', async () => {
      await render(<TestDrawer defaultOpen />);

      // The drawer dismisses downwards by default; swiping up must not close it.
      await swipe(0, -100);

      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('ignores a swipe across the dismiss axis', async () => {
      await render(<TestDrawer defaultOpen />);

      await swipe(100, 0);

      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('dismisses towards swipeDirection', async () => {
      await render(<TestDrawer defaultOpen swipeDirection="left" />);

      await swipe(-100, 0);

      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('lets onOpenChange cancel the dismissal', async () => {
      const onOpenChange = jest.fn((_open, eventDetails) => eventDetails.cancel());
      await render(<TestDrawer defaultOpen onOpenChange={onOpenChange} />);

      await swipe(0, 100);

      expect(onOpenChange).toHaveBeenCalled();
      expect(screen.getByTestId('popup')).toBeTruthy();
    });

    it('closes a controlled drawer only when the consumer commits', async () => {
      const onOpenChange = jest.fn();
      await render(<TestDrawer open onOpenChange={onOpenChange} />);

      await swipe(0, 100);

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'swipe' }));
      expect(screen.getByTestId('popup')).toBeTruthy();
    });
  });

  describe('state', () => {
    // As with Slider, the in-flight `swiping`/`swipeMovement` phase is not
    // assertable: `fireGestureHandler` always ends the gesture it fires and React
    // batches every handler it triggers into a single render, so the popup is
    // back at rest by the time it returns.
    it('publishes the resting swipe state to a style function', async () => {
      await render(
        <GestureHandlerRootView>
          <Drawer.Root defaultOpen swipeDirection="up">
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup
                  testID="popup"
                  style={(state) => ({
                    opacity: state.swiping ? 0.5 : 1,
                    transform: [{ translateY: -state.swipeMovement }],
                  })}
                />
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        </GestureHandlerRootView>,
      );

      expect(screen.getByTestId('popup')).toHaveStyle({
        opacity: 1,
        transform: [{ translateY: -0 }],
      });
    });
  });

  describe('dialog parts', () => {
    it('still dismisses on an outside press', async () => {
      const user = userEvent.setup();
      await render(<TestDrawer defaultOpen />);

      await user.press(screen.getByTestId('viewport'));

      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('respects disablePointerDismissal without affecting swipe', async () => {
      const user = userEvent.setup();
      await render(<TestDrawer defaultOpen disablePointerDismissal />);

      await user.press(screen.getByTestId('viewport'));
      expect(screen.getByTestId('popup')).toBeTruthy();

      await swipe(0, 100);
      expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('labels the popup with the title', async () => {
      await render(<TestDrawer defaultOpen />);

      const popup = screen.getByTestId('popup');
      expect(popup.props.role).toBe('dialog');
      expect(popup.props.accessibilityLabelledBy).toBeTruthy();
    });
  });
});
