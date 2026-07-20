import * as React from 'react';
import { AppState, Text, type AppStateStatus } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Toast, createToastManager } from '../index';
import { ToastStore } from '../store';
import type { ToastProviderProps } from '../provider/ToastProvider';
import { useToastProviderContext } from '../provider/ToastProviderContext';

/**
 * Renders nothing; captures the ToastStore instance so tests can inspect its
 * internal state (transitionStatus, measuredHeight, etc.) directly.
 */
let testStore: ToastStore | undefined = undefined;
function CaptureStore() {
  testStore = useToastProviderContext();
  return null;
}

function ToastList({ removeOnClose }: { removeOnClose?: boolean }) {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport testID="viewport">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          testID={`toast-${toast.id}`}
          removeOnClose={removeOnClose}
        >
          <Toast.Title testID={`title-${toast.id}`} />
          <Toast.Description testID={`description-${toast.id}`} />
          <Toast.Action testID={`action-${toast.id}`}>
            <Text>Undo</Text>
          </Toast.Action>
          <Toast.Close testID={`close-${toast.id}`}>
            <Text>Close</Text>
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

function TestToasts({
  removeOnClose,
  children,
  ...providerProps
}: ToastProviderProps & { removeOnClose?: boolean }) {
  return (
    <GestureHandlerRootView>
      <Toast.Provider {...providerProps}>
        <CaptureStore />
        {children}
        <ToastList removeOnClose={removeOnClose} />
      </Toast.Provider>
    </GestureHandlerRootView>
  );
}

/** Renders a button that adds a toast, since toasts come from event handlers. */
function AddButton({ options = {} }: { options?: any }) {
  const { add } = Toast.useToastManager();
  return (
    <Text testID="add" onPress={() => add({ title: 'Saved', ...options })}>
      Add
    </Text>
  );
}

function toastIds() {
  return screen
    .queryAllByTestId(/^toast-/)
    .map((node) => node.props.testID.replace('toast-', ''));
}

/**
 * React Native offers no way to emit an AppState change, so every test runs with
 * the listener `Toast.Provider` registers captured here. Installed for the whole
 * file rather than per test: it must be in place before any Provider mounts.
 */
let appStateListener: ((status: AppStateStatus) => void) | undefined;

beforeEach(() => {
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateListener = handler as (status: AppStateStatus) => void;
    return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function emitAppState(status: AppStateStatus) {
  await act(async () => {
    appStateListener?.(status);
  });
}

/** Swipes a toast by `translationX` pixels and releases. */
async function swipe(testID: string, translationX: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId(testID), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: translationX / 2, translationY: 0 },
      { state: State.ACTIVE, translationX, translationY: 0 },
      { state: State.END, translationX, translationY: 0 },
    ]);
  });
}

describe('Toast', () => {
  it('renders no toasts initially', async () => {
    await render(<TestToasts />);

    expect(screen.getByTestId('viewport')).toBeTruthy();
    expect(toastIds()).toEqual([]);
  });

  it('throws when a part is used outside Toast.Provider', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Toast.Viewport />)).rejects.toThrow(/within <Toast.Provider>/);

    error.mockRestore();
  });

  it('throws when a part is used outside Toast.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      render(
        <Toast.Provider>
          <Toast.Title />
        </Toast.Provider>,
      ),
    ).rejects.toThrow(/must be placed within <Toast.Root>/);

    error.mockRestore();
  });

  describe('adding', () => {
    it('adds a toast and renders its title and description', async () => {
      const user = userEvent.setup();
      await render(
        <TestToasts>
          <AddButton options={{ title: 'Saved', description: 'Your changes are safe.' }} />
        </TestToasts>,
      );

      await user.press(screen.getByTestId('add'));

      const [id] = toastIds();
      expect(screen.getByTestId(`title-${id}`)).toHaveTextContent('Saved');
      expect(screen.getByTestId(`description-${id}`)).toHaveTextContent('Your changes are safe.');
    });

    it('adds newest first', async () => {
      const user = userEvent.setup();
      await render(
        <TestToasts>
          <AddButton />
        </TestToasts>,
      );

      await user.press(screen.getByTestId('add'));
      const [first] = toastIds();

      await user.press(screen.getByTestId('add'));

      expect(toastIds()[1]).toBe(first);
      expect(toastIds()).toHaveLength(2);
    });

    it('starts a toast in the starting transition status', async () => {
      const user = userEvent.setup();
      await render(
        <TestToasts>
          <AddButton />
        </TestToasts>,
      );

      await user.press(screen.getByTestId('add'));

      const [id] = toastIds();
      expect(screen.getByTestId(`toast-${id}`)).toBeTruthy();
    });
  });

  describe('the manager', () => {
    it('adds a toast from outside React', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} />);

      await act(async () => {
        manager.add({ title: 'From outside' });
      });

      expect(toastIds()).toHaveLength(1);
    });

    it('closes a toast by id', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });
      await act(async () => {
        manager.close(id);
      });

      expect(toastIds()).toEqual([]);
    });

    it('updates a toast in place', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saving' });
      });
      await act(async () => {
        manager.update(id, { title: 'Saved' });
      });

      expect(toastIds()).toHaveLength(1);
      expect(screen.getByTestId(`title-${id}`)).toHaveTextContent('Saved');
    });

    it('adding with an existing id updates it rather than duplicating', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} />);

      await act(async () => {
        manager.add({ id: 'fixed', title: 'First' });
      });
      await act(async () => {
        manager.add({ id: 'fixed', title: 'Second' });
      });

      expect(toastIds()).toEqual(['fixed']);
      expect(screen.getByTestId('title-fixed')).toHaveTextContent('Second');
    });

    it('calls onClose when a toast closes', async () => {
      const onClose = jest.fn();
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved', onClose });
      });
      await act(async () => {
        manager.close(id);
      });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('the timeout', () => {
    it('closes a toast once its timeout elapses', async () => {
      jest.useFakeTimers();
      try {
        const manager = createToastManager();
        await render(<TestToasts toastManager={manager} timeout={1000} />);

        await act(async () => {
          manager.add({ title: 'Saved' });
        });
        expect(toastIds()).toHaveLength(1);

        await act(async () => {
          jest.advanceTimersByTime(999);
        });
        expect(toastIds()).toHaveLength(1);

        await act(async () => {
          jest.advanceTimersByTime(1);
        });
        expect(toastIds()).toEqual([]);
      } finally {
        jest.useRealTimers();
      }
    });

    it('honours a per-toast timeout', async () => {
      jest.useFakeTimers();
      try {
        const manager = createToastManager();
        await render(<TestToasts toastManager={manager} timeout={10000} />);

        await act(async () => {
          manager.add({ title: 'Saved', timeout: 500 });
        });
        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        expect(toastIds()).toEqual([]);
      } finally {
        jest.useRealTimers();
      }
    });

    it('a timeout of 0 never auto-dismisses', async () => {
      jest.useFakeTimers();
      try {
        const manager = createToastManager();
        await render(<TestToasts toastManager={manager} timeout={0} />);

        await act(async () => {
          manager.add({ title: 'Saved' });
        });
        await act(async () => {
          jest.advanceTimersByTime(60000);
        });

        expect(toastIds()).toHaveLength(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('a loading toast never auto-dismisses', async () => {
      jest.useFakeTimers();
      try {
        const manager = createToastManager();
        await render(<TestToasts toastManager={manager} timeout={1000} />);

        await act(async () => {
          manager.add({ title: 'Loading', type: 'loading' });
        });
        await act(async () => {
          jest.advanceTimersByTime(60000);
        });

        expect(toastIds()).toHaveLength(1);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('the limit', () => {
    it('marks toasts beyond the limit as limited, keeping them in the list', async () => {
      const seen: boolean[] = [];
      const manager = createToastManager();

      function LimitedList() {
        const { toasts } = Toast.useToastManager();
        return (
          <Toast.Viewport>
            {toasts.map((toast) => (
              <Toast.Root
                key={toast.id}
                toast={toast}
                testID={`toast-${toast.id}`}
                style={(state) => {
                  if (toast.id === 'first') {
                    seen.push(state.limited);
                  }
                  return {};
                }}
              />
            ))}
          </Toast.Viewport>
        );
      }

      await render(
        <GestureHandlerRootView>
          <Toast.Provider toastManager={manager} limit={1} timeout={0}>
            <LimitedList />
          </Toast.Provider>
        </GestureHandlerRootView>,
      );

      await act(async () => {
        manager.add({ id: 'first', title: 'First' });
      });
      expect(seen.at(-1)).toBe(false);

      await act(async () => {
        manager.add({ id: 'second', title: 'Second' });
      });

      // Still rendered, just flagged, so the consumer can animate it away.
      expect(toastIds()).toHaveLength(2);
      expect(seen.at(-1)).toBe(true);
    });
  });

  describe('closing', () => {
    it('closes from the close button', async () => {
      const user = userEvent.setup();
      await render(
        <TestToasts timeout={0}>
          <AddButton />
        </TestToasts>,
      );

      await user.press(screen.getByTestId('add'));
      const [id] = toastIds();

      await user.press(screen.getByTestId(`close-${id}`));

      expect(toastIds()).toEqual([]);
    });

    it('removeOnClose={false} keeps the toast for an exit animation', async () => {
      const user = userEvent.setup();
      await render(
        <TestToasts timeout={0} removeOnClose={false}>
          <AddButton />
        </TestToasts>,
      );

      await user.press(screen.getByTestId('add'));
      const [id] = toastIds();

      await user.press(screen.getByTestId(`close-${id}`));

      // Still there, now ending: nothing in RN can report that an animation
      // finished, so removal is the consumer's call.
      expect(toastIds()).toEqual([id]);
    });

    it('remove() drops a toast the consumer animated out', async () => {
      const user = userEvent.setup();
      const manager = createToastManager();

      // Stands in for the consumer's "my exit animation just finished" callback.
      function RemoveButton() {
        const { toasts, remove } = Toast.useToastManager();
        return (
          <Text testID="remove" onPress={() => toasts.forEach((toast) => remove(toast.id))}>
            Remove
          </Text>
        );
      }

      await render(
        <TestToasts toastManager={manager} timeout={0} removeOnClose={false}>
          <RemoveButton />
        </TestToasts>,
      );

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });
      await act(async () => {
        manager.close(id);
      });
      expect(toastIds()).toEqual([id]);

      await user.press(screen.getByTestId('remove'));

      expect(toastIds()).toEqual([]);
    });

    it('calls onRemove when the toast leaves the list', async () => {
      const onRemove = jest.fn();
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved', onRemove });
      });
      await act(async () => {
        manager.close(id);
      });

      expect(onRemove).toHaveBeenCalled();
    });

    it('preserves measuredHeight on close for exit animation', async () => {
      const user = userEvent.setup();
      const manager = createToastManager();
      await render(
        <TestToasts toastManager={manager} timeout={0} removeOnClose={false}>
          <AddButton />
        </TestToasts>,
      );

      await user.press(screen.getByTestId('add'));
      const [id] = toastIds();

      // Simulate a layout measurement so the toast has a known height.
      await act(async () => {
        fireEvent(screen.getByTestId(`toast-${id}`), 'layout', {
          nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 80 } },
        });
      });

      expect(testStore!.select('toast', id)?.height).toBe(80);

      // Close the toast.
      await act(async () => {
        manager.close(id);
      });

      // measuredHeight preserves the last measured height before close.
      expect(testStore!.select('toast', id)?.measuredHeight).toBe(80);
      // height is set to 0 for stack collapse.
      expect(testStore!.select('toast', id)?.height).toBe(0);
    });
  });

  describe('transition status', () => {
    it('auto-clears from starting to undefined so enter animations do not re-trigger', async () => {
      // In the test environment `requestAnimationFrame` fires synchronously, so
      // the auto-clear effect completes within the same `act` block as `add`.
      // This asserts the end-state: status is cleared after the first commit.
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      // The auto-clear effect ran during the act block (sync rAF), so
      // transitionStatus has already been cleared to undefined.
      expect(testStore!.select('toast', id)?.transitionStatus).toBeUndefined();
    });

    it('preserves ending status when a toast is closed during the starting frame', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} removeOnClose={false} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      // Close before the auto-clear's rAF callback fires.
      await act(async () => {
        manager.close(id);
      });

      // The auto-clear effect's guard (updateToastInternal bails on 'ending')
      // prevents the status from being overwritten back to undefined.
      expect(testStore!.select('toast', id)?.transitionStatus).toBe('ending');
    });
  });

  describe('pausing', () => {
    // A full gesture cannot show this end to end: `fireGestureHandler` always
    // ends the gesture it fires, and pause/resume both land in the same
    // synchronous batch, so no fake-timer time passes while paused.
    it('pauses the timers while a finger is on the toast, and resumes after', async () => {
      const pauseTimers = jest.spyOn(ToastStore.prototype, 'pauseTimers');
      const resumeTimers = jest.spyOn(ToastStore.prototype, 'resumeTimers');
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={1000} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });
      pauseTimers.mockClear();
      resumeTimers.mockClear();

      await swipe(`toast-${id}`, 0);

      expect(pauseTimers).toHaveBeenCalled();
      expect(resumeTimers).toHaveBeenCalled();
    });

    it('does not resume while the app is backgrounded', async () => {
      const resumeTimers = jest.spyOn(ToastStore.prototype, 'resumeTimers');
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={1000} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      await emitAppState('background');
      resumeTimers.mockClear();

      // Letting go while the app is in the background must not restart the
      // countdown — nobody can see the toast.
      await swipe(`toast-${id}`, 0);

      expect(resumeTimers).not.toHaveBeenCalled();
    });

    it('pauses and resumes the timers with the app going to the background', async () => {
      const pauseTimers = jest.spyOn(ToastStore.prototype, 'pauseTimers');
      const resumeTimers = jest.spyOn(ToastStore.prototype, 'resumeTimers');
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={1000} />);

      await act(async () => {
        manager.add({ title: 'Saved' });
      });
      pauseTimers.mockClear();
      resumeTimers.mockClear();

      await emitAppState('background');
      expect(pauseTimers).toHaveBeenCalled();

      await emitAppState('active');
      expect(resumeTimers).toHaveBeenCalled();
    });
  });

  describe('swipe dismissal', () => {
    it('closes on a swipe past the threshold', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      await swipe(`toast-${id}`, 100);

      expect(toastIds()).toEqual([]);
    });

    it('stays when the swipe does not reach the threshold', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      await swipe(`toast-${id}`, 20);

      expect(toastIds()).toEqual([id]);
    });

    it('ignores a swipe against the dismiss direction', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      // The default dismiss direction is right.
      await swipe(`toast-${id}`, -100);

      expect(toastIds()).toEqual([id]);
    });
  });

  describe('the promise API', () => {
    it('shows loading, then success', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let resolvePromise: (value: string) => void = () => {};
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      await act(async () => {
        manager.promise(promise, {
          loading: 'Saving…',
          success: (result) => `Saved ${result}`,
          error: 'Failed',
        });
      });

      let [id] = toastIds();
      expect(screen.getByTestId(`description-${id}`)).toHaveTextContent('Saving…');

      await act(async () => {
        resolvePromise('now');
        await promise;
      });

      [id] = toastIds();
      expect(screen.getByTestId(`description-${id}`)).toHaveTextContent('Saved now');
    });

    it('shows the error and rejects', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      const promise = Promise.reject(new Error('nope'));

      await act(async () => {
        const handled = manager.promise(promise, {
          loading: 'Saving…',
          success: 'Saved',
          error: (error) => `Failed: ${error.message}`,
        });
        await expect(handled).rejects.toThrow('nope');
      });

      const [id] = toastIds();
      expect(screen.getByTestId(`description-${id}`)).toHaveTextContent('Failed: nope');
    });

    it('returns the resolved value to the caller', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      await act(async () => {
        const handled = manager.promise(Promise.resolve(42), {
          loading: 'Loading',
          success: 'Done',
          error: 'Failed',
        });
        await expect(handled).resolves.toBe(42);
      });
    });
  });

  describe('accessibility', () => {
    it('announces politely by default and urgently for high priority', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let low = '';
      let high = '';
      await act(async () => {
        low = manager.add({ title: 'Low' });
        high = manager.add({ title: 'High', priority: 'high' });
      });

      expect(screen.getByTestId(`toast-${low}`).props.accessibilityLiveRegion).toBe('polite');
      expect(screen.getByTestId(`toast-${high}`).props.accessibilityLiveRegion).toBe('assertive');
    });

    it('labels the toast with its title', async () => {
      const manager = createToastManager();
      await render(<TestToasts toastManager={manager} timeout={0} />);

      let id = '';
      await act(async () => {
        id = manager.add({ title: 'Saved' });
      });

      const titleId = screen.getByTestId(`title-${id}`).props.nativeID;
      expect(screen.getByTestId(`toast-${id}`).props.accessibilityLabelledBy).toBe(titleId);
    });

    it('lets touches through the viewport but not the toasts', async () => {
      await render(<TestToasts />);

      expect(screen.getByTestId('viewport').props.pointerEvents).toBe('box-none');
    });
  });
});
