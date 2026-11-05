import { Keyboard, Platform } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useKeyboardCollisionPadding } from './useKeyboardCollisionPadding';

type Listener = (event: { endCoordinates: { height: number } }) => void;

describe('useKeyboardCollisionPadding', () => {
  const listeners = new Map<string, Listener>();
  const remove = jest.fn();
  const originalOS = Platform.OS;

  beforeEach(() => {
    listeners.clear();
    remove.mockClear();
    jest.spyOn(Keyboard, 'metrics').mockReturnValue(undefined);
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, listener: Listener) => {
      listeners.set(event, listener);
      return { remove };
    }) as never);
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it('passes the padding through untouched while there is no keyboard', async () => {
    const { result } = await renderHook(() => useKeyboardCollisionPadding(5));

    expect(result.current).toBe(5);
  });

  it('raises only the bottom of a numeric padding when the keyboard shows', async () => {
    const { result } = await renderHook(() => useKeyboardCollisionPadding(5));

    await act(async () => {
      listeners.get('keyboardWillShow')?.({ endCoordinates: { height: 300 } });
    });

    expect(result.current).toEqual({ top: 5, right: 5, bottom: 305, left: 5 });
  });

  it('adds to an object padding, and goes back when the keyboard hides', async () => {
    const padding = { bottom: 10, left: 2 };
    const { result } = await renderHook(() => useKeyboardCollisionPadding(padding));

    await act(async () => {
      listeners.get('keyboardWillShow')?.({ endCoordinates: { height: 300 } });
    });
    expect(result.current).toEqual({ bottom: 310, left: 2 });

    await act(async () => {
      listeners.get('keyboardWillHide')?.({ endCoordinates: { height: 0 } });
    });
    expect(result.current).toBe(padding);
  });

  it('accounts for a keyboard that was already up when it mounted', async () => {
    jest.spyOn(Keyboard, 'metrics').mockReturnValue({
      height: 200,
      screenX: 0,
      screenY: 0,
      width: 400,
    });

    const { result } = await renderHook(() => useKeyboardCollisionPadding(5));

    expect(result.current).toEqual({ top: 5, right: 5, bottom: 205, left: 5 });
  });

  // The list opens on focus, which is when the keyboard starts to show: the popup
  // mounts after `keyboardWillShow` has fired, and `metrics()` stays empty until
  // `keyboardDidShow`. With only the will-event it read 0 for as long as it was open.
  it('hears a keyboard that started showing before it mounted', async () => {
    const { result } = await renderHook(() => useKeyboardCollisionPadding(5));

    await act(async () => {
      listeners.get('keyboardDidShow')?.({ endCoordinates: { height: 300 } });
    });

    expect(result.current).toEqual({ top: 5, right: 5, bottom: 305, left: 5 });
  });

  it('does not keep a height from a did-show that lands after a will-hide', async () => {
    const { result } = await renderHook(() => useKeyboardCollisionPadding(5));

    await act(async () => {
      listeners.get('keyboardWillHide')?.({ endCoordinates: { height: 0 } });
      listeners.get('keyboardDidShow')?.({ endCoordinates: { height: 300 } });
    });
    await act(async () => {
      listeners.get('keyboardDidHide')?.({ endCoordinates: { height: 0 } });
    });

    expect(result.current).toBe(5);
  });

  it('uses the did-events on Android, which has no will-events', async () => {
    Platform.OS = 'android';
    await renderHook(() => useKeyboardCollisionPadding(5));

    expect([...listeners.keys()]).toEqual(['keyboardDidShow', 'keyboardDidHide']);
  });

  it('stops listening when it unmounts', async () => {
    const { unmount } = await renderHook(() => useKeyboardCollisionPadding(5));

    await unmount();

    expect(remove).toHaveBeenCalledTimes(4);
  });
});
