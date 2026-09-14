import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView, State, usePanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Drawer } from '../index';

// **`simultaneousGesture` is what lets a consumer move the SHEET on the UI
// thread.** The popup's own handlers touch React state and so run on JS
// (`runOnJS: true`), which puts a render between the finger and the sheet — and
// a sheet travels half a screen, so it shows there more than anywhere else. zest
// will not animate and will not take reanimated, so instead a consumer attaches
// a gesture of its own and drives the transform from a shared value. Both
// gestures see the same touch. Same arrangement `Slider.Control` has.
function WithConsumerGesture({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  // The gesture is built INSIDE the component: `usePanGesture` is a hook, so a
  // test cannot hand one in from the outside.
  const gesture = usePanGesture({});
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

async function swipeDown(translationY: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('popup'), [
      { state: State.BEGAN, translationX: 0, translationY: 0, velocityX: 0, velocityY: 0 },
      { state: State.ACTIVE, translationX: 0, translationY, velocityX: 0, velocityY: 0 },
      { state: State.END, translationX: 0, translationY, velocityX: 0, velocityY: 0 },
    ]);
  });
}

// **There is no test here that the consumer gesture was ATTACHED, and that is a
// limit rather than an oversight.** Under the hook API a gesture registers with
// gesture-handler's jest registry when it is CREATED, not when it reaches a
// `GestureDetector` — a `usePanGesture` that is never attached is still found by
// `getByGestureTestId`. So an existence check passes just as well with the
// composition deleted, which makes it worth nothing. What is left is the
// regression that matters: zest's own gesture must keep working when a consumer
// attaches one.
describe('Drawer.Popup simultaneousGesture', () => {
  it('still dismisses on a swipe when a consumer gesture is attached', async () => {
    // The point of composing over replacing: zest's own gesture keeps running.
    // If the consumer's had taken its place the drawer would never close.
    const onOpenChange = jest.fn();
    await render(<WithConsumerGesture onOpenChange={onOpenChange} />);
    await act(async () => {
      fireEvent(screen.getByTestId('popup'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 750, height: 600 } },
      });
    });

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
