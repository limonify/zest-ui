import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { NumberField } from '../index';
import type { NumberFieldRootProps } from './NumberFieldRoot';

function TestNumberField({
  pixelSensitivity,
  ...props
}: NumberFieldRootProps & { pixelSensitivity?: number }) {
  return (
    <GestureHandlerRootView>
      <NumberField.Root testID="root" {...props}>
        <NumberField.ScrubArea testID="scrub" pixelSensitivity={pixelSensitivity}>
          <Text>Scrub</Text>
        </NumberField.ScrubArea>
        <NumberField.Group testID="group">
          <NumberField.Decrement testID="decrement">
            <Text>-</Text>
          </NumberField.Decrement>
          <NumberField.Input testID="input" />
          <NumberField.Increment testID="increment">
            <Text>+</Text>
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </GestureHandlerRootView>
  );
}

function inputValue() {
  return screen.getByTestId('input').props.value;
}

async function type(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('input'), text);
  });
}

async function blur() {
  await act(async () => {
    fireEvent(screen.getByTestId('input'), 'blur', { nativeEvent: {} });
  });
}

/** Drags the scrub area by `translationX` pixels and releases. */
async function scrub(translationX: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('scrub'), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: translationX / 2, translationY: 0 },
      { state: State.ACTIVE, translationX, translationY: 0 },
      { state: State.END, translationX, translationY: 0 },
    ]);
  });
}

describe('NumberField', () => {
  it('renders every part', async () => {
    await render(<TestNumberField defaultValue={5} />);

    expect(screen.getByTestId('root')).toBeTruthy();
    expect(screen.getByTestId('group')).toBeTruthy();
    expect(screen.getByTestId('input')).toBeTruthy();
    expect(screen.getByTestId('increment')).toBeTruthy();
    expect(screen.getByTestId('decrement')).toBeTruthy();
    expect(screen.getByTestId('scrub')).toBeTruthy();
  });

  it('throws when a part is used outside NumberField.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<NumberField.Group />)).rejects.toThrow(
      /must be placed within <NumberField.Root>/,
    );

    error.mockRestore();
  });

  describe('value', () => {
    it('renders an empty input with no value', async () => {
      await render(<TestNumberField />);

      expect(inputValue()).toBe('');
    });

    it('renders the formatted default value', async () => {
      await render(<TestNumberField defaultValue={1234.5} locale="en-US" />);

      expect(inputValue()).toBe('1,234.5');
    });

    it('follows a controlled value', async () => {
      const view = await render(<TestNumberField value={5} />);
      expect(inputValue()).toBe('5');

      await view.rerender(<TestNumberField value={9} />);
      expect(inputValue()).toBe('9');
    });

    it('formats with the given options and locale', async () => {
      await render(
        <TestNumberField defaultValue={12} format={{ style: 'currency', currency: 'EUR' }} locale="en-US" />,
      );

      expect(inputValue()).toBe('€12.00');
    });
  });

  describe('typing', () => {
    it('reports a parseable number with the input-change reason', async () => {
      const onValueChange = jest.fn();
      await render(<TestNumberField onValueChange={onValueChange} />);

      await type('42');

      expect(onValueChange).toHaveBeenCalledWith(42, expect.objectContaining({ reason: 'input-change' }));
    });

    it('does not reformat the text while typing', async () => {
      await render(<TestNumberField locale="en-US" />);

      await type('1234');

      // Reformatting mid-edit would move the caret and fight the user.
      expect(inputValue()).toBe('1234');
    });

    it('formats the text on blur', async () => {
      await render(<TestNumberField locale="en-US" />);

      await type('1234');
      await blur();

      expect(inputValue()).toBe('1,234');
    });

    it('keeps text that does not parse yet', async () => {
      const onValueChange = jest.fn();
      await render(<TestNumberField onValueChange={onValueChange} />);

      await type('-');

      expect(inputValue()).toBe('-');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('restores the last good value when the text never parses', async () => {
      await render(<TestNumberField defaultValue={7} />);

      await type('abc');
      await blur();

      expect(inputValue()).toBe('7');
    });

    it('reports an emptied field as null with the input-clear reason', async () => {
      const onValueChange = jest.fn();
      await render(<TestNumberField defaultValue={5} onValueChange={onValueChange} />);

      await type('');

      expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'input-clear' }));
    });

    it('commits on blur', async () => {
      const onValueCommitted = jest.fn();
      await render(<TestNumberField onValueCommitted={onValueCommitted} />);

      await type('42');
      await blur();

      expect(onValueCommitted).toHaveBeenCalledWith(42, expect.objectContaining({ reason: 'input-blur' }));
    });

    it('does not commit when blurring an untouched empty field', async () => {
      const onValueCommitted = jest.fn();
      await render(<TestNumberField onValueCommitted={onValueCommitted} />);

      await blur();

      expect(onValueCommitted).not.toHaveBeenCalled();
    });

    it('ignores typing when readOnly', async () => {
      const onValueChange = jest.fn();
      await render(<TestNumberField defaultValue={5} readOnly onValueChange={onValueChange} />);

      await type('42');

      expect(onValueChange).not.toHaveBeenCalled();
      expect(inputValue()).toBe('5');
    });
  });

  describe('min and max', () => {
    it('clamps typed text by default', async () => {
      await render(<TestNumberField min={0} max={10} />);

      await type('50');
      await blur();

      expect(inputValue()).toBe('10');
    });

    it('allowOutOfRange leaves typed text unclamped', async () => {
      const onValueChange = jest.fn();
      await render(<TestNumberField min={0} max={10} allowOutOfRange onValueChange={onValueChange} />);

      await type('50');

      expect(onValueChange).toHaveBeenCalledWith(50, expect.anything());
    });

    it('clamps a step even with allowOutOfRange', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      await render(
        <TestNumberField defaultValue={9} min={0} max={10} step={5} allowOutOfRange onValueChange={onValueChange} />,
      );

      await user.press(screen.getByTestId('increment'));

      expect(onValueChange).toHaveBeenCalledWith(10, expect.anything());
    });
  });

  describe('stepper buttons', () => {
    it('increments by the step', async () => {
      const user = userEvent.setup();
      await render(<TestNumberField defaultValue={5} step={3} />);

      await user.press(screen.getByTestId('increment'));

      expect(inputValue()).toBe('8');
    });

    it('decrements by the step', async () => {
      const user = userEvent.setup();
      await render(<TestNumberField defaultValue={5} step={3} />);

      await user.press(screen.getByTestId('decrement'));

      expect(inputValue()).toBe('2');
    });

    it('reports the press reason', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      await render(<TestNumberField defaultValue={0} onValueChange={onValueChange} />);

      await user.press(screen.getByTestId('increment'));

      expect(onValueChange).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'increment-press' }));
    });

    it('seeds an empty field from zero', async () => {
      const user = userEvent.setup();
      await render(<TestNumberField />);

      await user.press(screen.getByTestId('increment'));

      expect(inputValue()).toBe('0');
    });

    it('seeds an empty field into range', async () => {
      const user = userEvent.setup();
      await render(<TestNumberField min={5} max={10} />);

      // 0 is out of range, so it clamps to the nearest in-range value.
      await user.press(screen.getByTestId('increment'));

      expect(inputValue()).toBe('5');
    });

    it('is disabled at the boundary', async () => {
      await render(<TestNumberField defaultValue={10} max={10} />);

      expect(screen.getByTestId('increment').props.accessibilityState).toMatchObject({
        disabled: true,
      });
      expect(screen.getByTestId('decrement').props.accessibilityState.disabled).toBeFalsy();
    });

    it('is disabled when the root is disabled', async () => {
      await render(<TestNumberField defaultValue={5} disabled />);

      expect(screen.getByTestId('increment').props.accessibilityState).toMatchObject({
        disabled: true,
      });
    });

    it('commits when the press is released', async () => {
      const onValueCommitted = jest.fn();
      await render(<TestNumberField defaultValue={5} onValueCommitted={onValueCommitted} />);

      await act(async () => {
        fireEvent(screen.getByTestId('increment'), 'pressIn', { nativeEvent: {} });
      });
      await act(async () => {
        fireEvent(screen.getByTestId('increment'), 'pressOut', { nativeEvent: {} });
      });

      expect(onValueCommitted).toHaveBeenCalledWith(6, expect.objectContaining({ reason: 'increment-press' }));
    });

    it('repeats while held', async () => {
      jest.useFakeTimers();
      try {
        await render(<TestNumberField defaultValue={0} />);

        await act(async () => {
          fireEvent(screen.getByTestId('increment'), 'pressIn', { nativeEvent: {} });
        });
        expect(inputValue()).toBe('1');

        // Nothing repeats until the start delay has passed.
        await act(async () => {
          jest.advanceTimersByTime(399);
        });
        expect(inputValue()).toBe('1');

        await act(async () => {
          jest.advanceTimersByTime(1 + 60 * 3);
        });
        expect(inputValue()).toBe('4');

        await act(async () => {
          fireEvent(screen.getByTestId('increment'), 'pressOut', { nativeEvent: {} });
        });
        await act(async () => {
          jest.advanceTimersByTime(60 * 3);
        });
        expect(inputValue()).toBe('4');
      } finally {
        jest.useRealTimers();
      }
    });

    it('stops repeating at the boundary', async () => {
      jest.useFakeTimers();
      try {
        await render(<TestNumberField defaultValue={0} max={2} />);

        await act(async () => {
          fireEvent(screen.getByTestId('increment'), 'pressIn', { nativeEvent: {} });
        });
        await act(async () => {
          jest.advanceTimersByTime(400 + 60 * 10);
        });

        expect(inputValue()).toBe('2');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('snapOnStep', () => {
    it('snaps to a multiple of the step', async () => {
      const user = userEvent.setup();
      await render(<TestNumberField defaultValue={4} step={5} snapOnStep min={0} />);

      await user.press(screen.getByTestId('increment'));

      expect(inputValue()).toBe('5');
    });
  });

  describe('scrub area', () => {
    it('steps once per pixelSensitivity pixels dragged', async () => {
      await render(<TestNumberField defaultValue={0} pixelSensitivity={10} />);

      await scrub(50);

      expect(inputValue()).toBe('5');
    });

    it('steps backwards when dragged the other way', async () => {
      await render(<TestNumberField defaultValue={0} pixelSensitivity={10} />);

      await scrub(-30);

      expect(inputValue()).toBe('-3');
    });

    it('reports the scrub reason and commits on release', async () => {
      const onValueChange = jest.fn();
      const onValueCommitted = jest.fn();
      await render(
        <TestNumberField
          defaultValue={0}
          pixelSensitivity={10}
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
        />,
      );

      await scrub(20);

      expect(onValueChange).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ reason: 'scrub' }));
      expect(onValueCommitted).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'scrub' }));
    });

    it('does not scrub when disabled', async () => {
      const onValueChange = jest.fn();
      await render(<TestNumberField defaultValue={0} disabled onValueChange={onValueChange} />);

      await scrub(50);

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('lets onValueChange cancel a typed change, keeping the typed text', async () => {
      const seen: Array<number | null> = [];
      const onValueChange = jest.fn((_value, eventDetails) => eventDetails.cancel());
      await render(
        <NumberField.Root
          defaultValue={5}
          onValueChange={onValueChange}
          style={(state) => {
            seen.push(state.value);
            return {};
          }}
        >
          <NumberField.Input testID="input" />
        </NumberField.Root>,
      );

      await type('42');
      await blur();

      expect(onValueChange).toHaveBeenCalledWith(42, expect.anything());
      // The value never moves...
      expect(seen.at(-1)).toBe(5);
      // ...but the rejected text is left in place, matching upstream: the user
      // typed it and is the one who has to correct it.
      expect(inputValue()).toBe('42');
    });

    it('lets onValueChange cancel a step', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn((_value, eventDetails) => eventDetails.cancel());
      await render(<TestNumberField defaultValue={5} onValueChange={onValueChange} />);

      await user.press(screen.getByTestId('increment'));

      expect(inputValue()).toBe('5');
    });
  });

  describe('accessibility', () => {
    it('exposes the range and value on the input', async () => {
      await render(<TestNumberField defaultValue={5} min={0} max={10} />);

      const input = screen.getByTestId('input');
      expect(input.props.accessibilityRole).toBe('spinbutton');
      expect(input.props.accessibilityValue).toMatchObject({ min: 0, max: 10, now: 5 });
    });

    it('marks the input as disabled', async () => {
      await render(<TestNumberField defaultValue={5} disabled />);

      expect(screen.getByTestId('input').props.editable).toBe(false);
    });

    it('groups the parts', async () => {
      await render(<TestNumberField defaultValue={5} />);

      expect(screen.getByTestId('group').props.role).toBe('group');
    });
  });
});
