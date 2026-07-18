import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { OTPField } from '../index';
import type { OTPFieldRootProps } from './OTPFieldRoot';

function TestOTPField({ length = 4, ...props }: Partial<OTPFieldRootProps>) {
  return (
    <OTPField.Root testID="root" length={length} {...props}>
      {Array.from({ length }, (_, index) => (
        <OTPField.Input key={index} testID={`slot-${index}`} />
      ))}
    </OTPField.Root>
  );
}

function slotValue(index: number) {
  return screen.getByTestId(`slot-${index}`).props.value;
}

function slotValues() {
  return screen.getAllByTestId(/^slot-/).map((slot) => slot.props.value);
}

async function type(index: number, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(`slot-${index}`), text);
  });
}

async function backspace(index: number) {
  await act(async () => {
    fireEvent(screen.getByTestId(`slot-${index}`), 'keyPress', {
      nativeEvent: { key: 'Backspace' },
    });
  });
}

describe('OTPField', () => {
  it('renders one input per slot', async () => {
    await render(<TestOTPField length={4} />);

    expect(screen.getByTestId('root')).toBeTruthy();
    expect(slotValues()).toEqual(['', '', '', '']);
  });

  it('throws when a part is used outside OTPField.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<OTPField.Input />)).rejects.toThrow(
      /must be placed within <OTPField.Root>/,
    );

    error.mockRestore();
  });

  describe('value', () => {
    it('spreads a default value across the slots', async () => {
      await render(<TestOTPField defaultValue="1234" />);

      expect(slotValues()).toEqual(['1', '2', '3', '4']);
    });

    it('clamps a value longer than the slot count', async () => {
      await render(<TestOTPField length={4} defaultValue="123456" />);

      expect(slotValues()).toEqual(['1', '2', '3', '4']);
    });

    it('follows a controlled value', async () => {
      const view = await render(<TestOTPField value="12" />);
      expect(slotValues()).toEqual(['1', '2', '', '']);

      await view.rerender(<TestOTPField value="123" />);
      expect(slotValues()).toEqual(['1', '2', '3', '']);
    });

    it('holds a controlled value the consumer does not change', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField value="12" onValueChange={onValueChange} />);

      await type(2, '3');

      expect(onValueChange).toHaveBeenCalledWith('123', expect.anything());
      expect(slotValues()).toEqual(['1', '2', '', '']);
    });
  });

  describe('typing', () => {
    it('fills a slot and reports the input-change reason', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField onValueChange={onValueChange} />);

      await type(0, '1');

      expect(slotValue(0)).toBe('1');
      expect(onValueChange).toHaveBeenCalledWith('1', expect.objectContaining({ reason: 'input-change' }));
    });

    it('replaces the character in an already filled slot', async () => {
      await render(<TestOTPField defaultValue="1234" />);

      // RN reports the old character plus the new one.
      await type(0, '19');

      expect(slotValues()).toEqual(['9', '2', '3', '4']);
    });

    it('spreads an autofilled code across every slot', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField onValueChange={onValueChange} />);

      // iOS and Android deliver the whole SMS code into the focused slot.
      await type(0, '1234');

      expect(slotValues()).toEqual(['1', '2', '3', '4']);
      expect(onValueChange).toHaveBeenCalledWith('1234', expect.anything());
    });

    it('writes a multi-character entry from the slot it landed on', async () => {
      await render(<TestOTPField defaultValue="1" />);

      await type(1, '99');

      expect(slotValues()).toEqual(['1', '9', '9', '']);
    });

    it('ignores typing when disabled', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField disabled onValueChange={onValueChange} />);

      await type(0, '1');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('ignores typing when readOnly', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField readOnly defaultValue="12" onValueChange={onValueChange} />);

      await type(2, '3');

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('rejects a non-digit by default', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField onValueChange={onValueChange} />);

      await type(0, 'a');

      expect(slotValue(0)).toBe('');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('reports rejected characters through onValueInvalid', async () => {
      const onValueInvalid = jest.fn();
      await render(<TestOTPField onValueInvalid={onValueInvalid} />);

      await type(0, 'a');

      expect(onValueInvalid).toHaveBeenCalledWith('a', expect.anything());
    });

    it('accepts letters when validationType is alpha', async () => {
      await render(<TestOTPField validationType="alpha" />);

      await type(0, 'a');

      expect(slotValue(0)).toBe('a');
    });

    it('accepts anything when validationType is none', async () => {
      await render(<TestOTPField validationType="none" />);

      await type(0, '!');

      expect(slotValue(0)).toBe('!');
    });

    it('applies normalizeValue', async () => {
      await render(
        <TestOTPField validationType="alpha" normalizeValue={(value) => value.toUpperCase()} />,
      );

      await type(0, 'ab');

      expect(slotValues()).toEqual(['A', 'B', '', '']);
    });

    it('strips whitespace from a pasted code', async () => {
      await render(<TestOTPField />);

      await type(0, '12 34');

      expect(slotValues()).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('deleting', () => {
    it('clears a filled slot', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField defaultValue="12" onValueChange={onValueChange} />);

      await type(1, '');

      expect(slotValues()).toEqual(['1', '', '', '']);
      expect(onValueChange).toHaveBeenCalledWith('1', expect.objectContaining({ reason: 'input-clear' }));
    });

    it('backspacing an empty slot clears the one before it', async () => {
      await render(<TestOTPField defaultValue="12" />);

      await backspace(2);

      expect(slotValues()).toEqual(['1', '', '', '']);
    });

    it('backspacing the first slot does nothing', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField onValueChange={onValueChange} />);

      await backspace(0);

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('backspacing a filled slot is left to onChangeText', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField defaultValue="12" onValueChange={onValueChange} />);

      // The text does change, so RN fires onChangeText and keyPress must not
      // also delete a character.
      await backspace(1);

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('completion', () => {
    it('fires onValueComplete when the last slot is filled', async () => {
      const onValueComplete = jest.fn();
      await render(<TestOTPField defaultValue="123" onValueComplete={onValueComplete} />);

      await type(3, '4');

      expect(onValueComplete).toHaveBeenCalledWith('1234', expect.anything());
    });

    it('fires onValueComplete for an autofilled code', async () => {
      const onValueComplete = jest.fn();
      await render(<TestOTPField onValueComplete={onValueComplete} />);

      await type(0, '1234');

      expect(onValueComplete).toHaveBeenCalledWith('1234', expect.anything());
    });

    it('does not fire onValueComplete while incomplete', async () => {
      const onValueComplete = jest.fn();
      await render(<TestOTPField onValueComplete={onValueComplete} />);

      await type(0, '123');

      expect(onValueComplete).not.toHaveBeenCalled();
    });

    it('publishes complete on the state', async () => {
      const seen: boolean[] = [];
      await render(
        <OTPField.Root
          length={2}
          defaultValue="1"
          style={(state) => {
            seen.push(state.complete);
            return {};
          }}
        >
          <OTPField.Input testID="slot-0" />
          <OTPField.Input testID="slot-1" />
        </OTPField.Root>,
      );

      expect(seen.at(-1)).toBe(false);

      await type(1, '2');

      expect(seen.at(-1)).toBe(true);
    });
  });

  describe('cancellation', () => {
    it('lets onValueChange cancel a change', async () => {
      const onValueChange = jest.fn((_value, eventDetails) => eventDetails.cancel());
      await render(<TestOTPField onValueChange={onValueChange} />);

      await type(0, '1');

      expect(onValueChange).toHaveBeenCalled();
      expect(slotValue(0)).toBe('');
    });
  });

  describe('mask', () => {
    it('masks a filled slot', async () => {
      await render(<TestOTPField mask defaultValue="12" />);

      expect(slotValues()).toEqual(['•', '•', '', '']);
    });

    it('does not leak the mask character into the value', async () => {
      // The slot shows a bullet, so RN reports the bullet plus the new
      // character. With `validationType="none"` nothing would strip the bullet
      // back out, so it has to be accounted for rather than filtered.
      await render(<TestOTPField mask validationType="none" defaultValue="1" />);

      await type(0, '•9');

      expect(slotValue(0)).toBe('•');
      expect(screen.getByTestId('slot-1').props.value).toBe('');
    });

    it('reports the unmasked value to the consumer', async () => {
      const onValueChange = jest.fn();
      await render(<TestOTPField mask defaultValue="1" onValueChange={onValueChange} />);

      await type(0, '•9');

      expect(onValueChange).toHaveBeenCalledWith('9', expect.anything());
    });
  });

  describe('accessibility and autofill', () => {
    it('advertises the one-time code on the first slot only', async () => {
      await render(<TestOTPField />);

      expect(screen.getByTestId('slot-0').props.autoComplete).toBe('one-time-code');
      expect(screen.getByTestId('slot-0').props.textContentType).toBe('oneTimeCode');
      expect(screen.getByTestId('slot-1').props.autoComplete).toBe('off');
    });

    it('derives slot ids from the root id', async () => {
      await render(<TestOTPField id="code" />);

      expect(screen.getByTestId('slot-0').props.nativeID).toBe('code');
      expect(screen.getByTestId('slot-1').props.nativeID).toBe('code-2');
    });

    it('uses a numeric keyboard by default and a text one for alpha', async () => {
      const view = await render(<TestOTPField />);
      expect(screen.getByTestId('slot-0').props.keyboardType).toBe('number-pad');

      await view.rerender(<TestOTPField validationType="alpha" />);
      expect(screen.getByTestId('slot-0').props.keyboardType).toBe('default');
    });

    it('hints done on the last slot and next on the others', async () => {
      await render(<TestOTPField />);

      expect(screen.getByTestId('slot-0').props.enterKeyHint).toBe('next');
      expect(screen.getByTestId('slot-3').props.enterKeyHint).toBe('done');
    });

    it('marks the slots as not editable when disabled', async () => {
      await render(<TestOTPField disabled />);

      expect(screen.getByTestId('slot-0').props.editable).toBe(false);
    });
  });
});
