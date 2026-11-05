import * as React from 'react';
import { Platform, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Autocomplete, Combobox } from '../../index';

const FRUITS = ['Apple', 'Banana', 'Cherry'];

function TestPortal(props: Partial<React.ComponentProps<typeof Combobox.Portal>>) {
  return (
    <Combobox.Root items={FRUITS} defaultOpen>
      <Combobox.Portal {...props}>
        <Combobox.Positioner>
          <Combobox.Popup testID="popup">
            <Combobox.List>
              {(item) => (
                <Combobox.Item key={String(item.value)} item={item}>
                  <Text>{item.label}</Text>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** Whether the tree holds the non-Modal overlay — a full-screen, touch-transparent view. */
function hasBoxNoneOverlay(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return false;
  }
  const element = node as { props?: Record<string, unknown>; children?: unknown[] };
  if (element.props?.pointerEvents === 'box-none') {
    return true;
  }
  return (element.children ?? []).some(hasBoxNoneOverlay);
}

describe('Combobox.Portal', () => {
  it('renders in a Modal by default', async () => {
    await render(<TestPortal />);
    expect(JSON.stringify(screen.toJSON())).toContain('Modal');
  });

  it('renders as a non-Modal overlay when modal={false}, keeping the popup mounted', async () => {
    await render(<TestPortal modal={false} />);

    // No `Modal` in the tree, and the overlay's touch-transparent full-screen
    // view is present — the two things that let the field behind keep focus.
    expect(JSON.stringify(screen.toJSON())).not.toContain('Modal');
    expect(hasBoxNoneOverlay(screen.toJSON())).toBe(true);

    // The Positioner's "must be within Portal" guard is still satisfied, so the
    // popup mounts rather than throwing.
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('works the same on an Autocomplete', async () => {
    await render(
      <Autocomplete.Root items={FRUITS} defaultOpen>
        <Autocomplete.Portal modal={false}>
          <Autocomplete.Positioner>
            <Autocomplete.Popup testID="popup">
              <Autocomplete.List>
                {(item) => (
                  <Autocomplete.Item key={String(item.value)} item={item}>
                    <Text>{item.label}</Text>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    expect(JSON.stringify(screen.toJSON())).not.toContain('Modal');
    expect(screen.getByTestId('popup')).toBeTruthy();
  });
});

/** The native Modal node, found by the `onShow` the portal gives it. */
function findModal(node: unknown): { props: { onShow: (event: unknown) => void } } | undefined {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  const element = node as { props?: Record<string, unknown>; children?: unknown[] };
  if (typeof element.props?.onShow === 'function') {
    return element as { props: { onShow: (event: unknown) => void } };
  }
  for (const child of element.children ?? []) {
    const found = findModal(child);
    if (found) {
      return found;
    }
  }
  return undefined;
}

describe('Combobox.Input autoFocus inside a Modal', () => {
  function AutoFocusInput(props: {
    inputRef: React.RefObject<any>;
    autoFocus?: boolean;
    modal?: boolean;
    onShow?: () => void;
  }) {
    return (
      <Combobox.Root defaultOpen>
        <Combobox.Trigger />
        <Combobox.Portal modal={props.modal} modalProps={{ onShow: props.onShow }}>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Input testID="input" ref={props.inputRef} autoFocus={props.autoFocus} />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  }

  it('moves autoFocus from the native prop to the moment the Modal has shown', async () => {
    const inputRef = React.createRef<any>();
    const view = await render(<AutoFocusInput inputRef={inputRef} autoFocus />);

    expect(screen.getByTestId('input', { includeHiddenElements: true }).props.autoFocus).toBe(false);

    const focus = jest.spyOn(inputRef.current, 'focus');
    focus.mockClear();
    await act(async () => {
      findModal(view.container)?.props.onShow({});
    });

    expect(focus).toHaveBeenCalledTimes(1);
  });

  describe('on Android', () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
      Platform.OS = 'android';
    });

    afterEach(() => {
      Platform.OS = originalOS;
      jest.useRealTimers();
    });

    async function showModal(view: { container: unknown }) {
      jest.useFakeTimers();
      await act(async () => {
        findModal(view.container)?.props.onShow({});
      });
    }

    it('waits for the Modal window to have input focus', async () => {
      const inputRef = React.createRef<any>();
      const view = await render(<AutoFocusInput inputRef={inputRef} autoFocus />);
      const focus = jest.spyOn(inputRef.current, 'focus');
      focus.mockClear();

      await showModal(view);
      expect(focus).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(100);
      });
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('drops the pending focus when it unmounts first', async () => {
      const inputRef = React.createRef<any>();
      const view = await render(<AutoFocusInput inputRef={inputRef} autoFocus />);
      const focus = jest.spyOn(inputRef.current, 'focus');
      focus.mockClear();

      await showModal(view);
      await view.unmount();
      jest.advanceTimersByTime(100);

      expect(focus).not.toHaveBeenCalled();
    });
  });

  it('still calls the consumer onShow, and focuses nothing without autoFocus', async () => {
    const inputRef = React.createRef<any>();
    const onShow = jest.fn();
    const view = await render(<AutoFocusInput inputRef={inputRef} onShow={onShow} />);

    const focus = jest.spyOn(inputRef.current, 'focus');
    focus.mockClear();
    await act(async () => {
      findModal(view.container)?.props.onShow({});
    });

    expect(onShow).toHaveBeenCalledTimes(1);
    expect(focus).not.toHaveBeenCalled();
  });

  it('leaves the native prop alone in the non-Modal overlay', async () => {
    const inputRef = React.createRef<any>();
    await render(<AutoFocusInput inputRef={inputRef} autoFocus modal={false} />);

    expect(screen.getByTestId('input', { includeHiddenElements: true }).props.autoFocus).toBe(true);
  });
});
