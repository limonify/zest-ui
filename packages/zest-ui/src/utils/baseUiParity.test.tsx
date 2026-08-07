import * as React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Combobox, Field, Select, Slider } from '../index';

/**
 * Props Base UI has that zest was missing, found by diffing every part's props
 * against upstream. Each is adapted rather than copied — `getAriaValueText`
 * becomes `getAccessibilityValueText` because React Native has
 * `accessibilityValue.text`, not `aria-valuetext`.
 */
const hidden = { includeHiddenElements: true } as const;

describe('Select.Value placeholder', () => {
  function TestSelect(props: Partial<React.ComponentProps<typeof Select.Root>>) {
    return (
      <Select.Root items={{ apple: 'Apple' }} {...props}>
        <Select.Trigger testID="trigger">
          <Select.Value testID="value" placeholder="Pick a fruit" />
        </Select.Trigger>
      </Select.Root>
    );
  }

  it('shows while nothing is selected', async () => {
    await render(<TestSelect />);
    expect(screen.getByTestId('value')).toHaveTextContent('Pick a fruit');
  });

  it('gives way to the label once there is one', async () => {
    await render(<TestSelect defaultValue="apple" />);
    expect(screen.getByTestId('value')).toHaveTextContent('Apple');
  });

  it('is reported on state, so it can be styled differently', async () => {
    const styleFn = jest.fn(() => undefined);
    await render(
      <Select.Root items={{ apple: 'Apple' }}>
        <Select.Trigger>
          <Select.Value testID="value" placeholder="Pick" style={styleFn} />
        </Select.Trigger>
      </Select.Root>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ placeholder: true }));
  });

  it('loses to children', async () => {
    await render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value testID="value" placeholder="Pick">
            <Text>Custom</Text>
          </Select.Value>
        </Select.Trigger>
      </Select.Root>,
    );

    expect(screen.getByTestId('value')).toHaveTextContent('Custom');
  });
});

describe('Combobox.Value placeholder', () => {
  it('shows while the input is empty, and gives way to its text', async () => {
    await render(
      <Combobox.Root items={['Apple']}>
        <Combobox.Value testID="value" placeholder="Nothing yet" />
        <Combobox.Input testID="input" />
      </Combobox.Root>,
    );

    expect(screen.getByTestId('value')).toHaveTextContent('Nothing yet');

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'Ap');
    });

    expect(screen.getByTestId('value')).toHaveTextContent('Ap');
  });
});

describe('Combobox.Item disabled', () => {
  function TestCombobox(props: { itemDisabled?: boolean; rootDisabled?: boolean }) {
    return (
      <Combobox.Root items={['Apple', 'Banana']} defaultOpen disabled={props.rootDisabled}>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup testID="popup">
              <Combobox.List>
                {(item) => (
                  <Combobox.Item
                    key={String(item.value)}
                    testID={`item-${item.value}`}
                    item={item}
                    disabled={props.itemDisabled && item.value === 'Apple'}
                  >
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

  it('ignores a press on a disabled item', async () => {
    await render(<TestCombobox itemDisabled />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Apple'));

    expect(screen.getByTestId('popup', hidden)).toBeTruthy();
    expect(screen.getByTestId('item-Apple').props.accessibilityState.disabled).toBe(true);
  });

  it('leaves its siblings alone', async () => {
    await render(<TestCombobox itemDisabled />);

    expect(screen.getByTestId('item-Banana').props.accessibilityState.disabled).toBeUndefined();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Banana'));
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('inherits a disabled root', async () => {
    await render(<TestCombobox rootDisabled />);

    expect(screen.getByTestId('item-Apple').props.accessibilityState.disabled).toBe(true);
  });
});

describe('Slider getAccessibilityValueText', () => {
  it('replaces the announced text, per thumb', async () => {
    await render(
      <GestureHandlerRootView>
        <Slider.Root
          defaultValue={[20, 80]}
          getAccessibilityValueText={(text, value, index) =>
            `${index === 0 ? 'Minimum' : 'Maximum'} ${value}`
          }
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Thumb testID="thumb-0" index={0} />
              <Slider.Thumb testID="thumb-1" index={1} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </GestureHandlerRootView>,
    );

    expect(screen.getByTestId('thumb-0').props.accessibilityValue.text).toBe('Minimum 20');
    expect(screen.getByTestId('thumb-1').props.accessibilityValue.text).toBe('Maximum 80');
  });

  it('falls back to the formatted value without one', async () => {
    await render(
      <GestureHandlerRootView>
        <Slider.Root defaultValue={20} format={{ style: 'percent' }}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Thumb testID="thumb" index={0} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </GestureHandlerRootView>,
    );

    expect(screen.getByTestId('thumb').props.accessibilityValue.text).toContain('%');
  });
});

describe('Field validationDebounceTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits before validating a change', async () => {
    const validate = jest.fn(() => null);

    await render(
      <Field.Root validate={validate} validationMode="onChange" validationDebounceTime={200}>
        <Field.Control testID="control" />
      </Field.Root>,
    );

    validate.mockClear();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('control'), 'a');
      fireEvent.changeText(screen.getByTestId('control'), 'ab');
      fireEvent.changeText(screen.getByTestId('control'), 'abc');
    });

    // Still pending — three keystrokes, no validation yet.
    expect(validate).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // One call, for the last value only.
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith('abc');
  });

  it('validates on every keystroke without one', async () => {
    const validate = jest.fn(() => null);

    await render(
      <Field.Root validate={validate} validationMode="onChange">
        <Field.Control testID="control" />
      </Field.Root>,
    );

    validate.mockClear();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('control'), 'a');
      fireEvent.changeText(screen.getByTestId('control'), 'ab');
    });

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('lets a blur outrank anything still pending', async () => {
    const validate = jest.fn(() => null);

    await render(
      <Field.Root validate={validate} validationMode="onBlur" validationDebounceTime={200}>
        <Field.Control testID="control" />
      </Field.Root>,
    );

    validate.mockClear();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('control'), 'abc');
      fireEvent(screen.getByTestId('control'), 'blur');
    });

    // The blur validated immediately rather than waiting out the debounce.
    expect(validate).toHaveBeenCalledWith('abc');

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // And nothing fired a second time when the timer would have elapsed.
    expect(validate).toHaveBeenCalledTimes(1);
  });
});
