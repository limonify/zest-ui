import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Gesture, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Drawer } from '../index';

// **`simultaneousGesture` is what lets a consumer move the SHEET on the UI
// thread.** The popup's own handlers touch React state and so run on JS
// (`.runOnJS(true)`), which puts a render between the finger and the sheet — and
// a sheet travels half a screen, so it shows there more than anywhere else. zest
// will not animate and will not take reanimated, so instead a consumer attaches
// a gesture of its own and drives the transform from a shared value. Both
// gestures see the same touch. Same arrangement `Slider.Control` has.
function WithConsumerGesture({
  gesture,
  onOpenChange,
}: {
  gesture: ReturnType<typeof Gesture.Pan>;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <GestureHandlerRootView>
      <Drawer.Root defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup testID="popup" simultaneousGesture={gesture} />
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </GestureHandlerRootView>
  );
}

async function layoutPopup() {
  await act(async () => {
    fireEvent(screen.getByTestId('popup'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 750, height: 600 } },
    });
  });
}

async function swipeDown(translationY: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('popup'), [
      { state: State.BEGAN, translationX: 0, translationY: 0, velocityX: 0, velocityY: 0 },
      { state: State.ACTIVE, translationX: 0, translationY, velocityX: 0, velocityY: 0 },
      { state: State.END, translationX: 0, translationY, velocityX: 0, velocityY: 0 },
    ]);
  });
}

describe('Drawer.Popup simultaneousGesture', () => {
  it('attaches the consumer gesture to the detector', async () => {
    // A gesture is invisible in the tree; the only way to see whether it was
    // attached is gesture-handler's own registry, which is keyed by test id and
    // populated when the gesture reaches a `GestureDetector`. Drop the
    // `Gesture.Simultaneous` and this id is never registered.
    const gesture = Gesture.Pan().withTestId('consumer-pan');
    await render(<WithConsumerGesture gesture={gesture} />);
    await layoutPopup();

    expect(() => getByGestureTestId('consumer-pan')).not.toThrow();
  });

  it('still dismisses on a swipe when a consumer gesture is attached', async () => {
    // The point of `Simultaneous` over replacing: zest's own gesture keeps
    // running. If the consumer's had taken its place the drawer would never close.
    const onOpenChange = jest.fn();
    const gesture = Gesture.Pan();
    await render(<WithConsumerGesture gesture={gesture} onOpenChange={onOpenChange} />);
    await layoutPopup();

    await swipeDown(200);

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('renders without one, which is every existing consumer', async () => {
    await render(
      <GestureHandlerRootView>
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup testID="popup" />
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </GestureHandlerRootView>,
    );

    expect(screen.getByTestId('popup')).toBeTruthy();
  });
});
