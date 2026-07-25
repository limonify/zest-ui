import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Field, Input } from '../index';

async function changeText(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), text);
  });
}

async function blur(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), 'blur', { nativeEvent: {} });
  });
}

describe('Input', () => {
  it('renders standalone, without a Field', async () => {
    await render(<Input testID="input" />);

    expect(screen.getByTestId('input')).toBeTruthy();
    expect(screen.getByTestId('input').props.value).toBe('');
  });

  it('keeps its own text when uncontrolled', async () => {
    const onValueChange = jest.fn();
    await render(<Input testID="input" defaultValue="hi" onValueChange={onValueChange} />);

    expect(screen.getByTestId('input').props.value).toBe('hi');

    await changeText('input', 'hello');

    expect(onValueChange).toHaveBeenCalledWith('hello');
    expect(screen.getByTestId('input').props.value).toBe('hello');
  });

  it('only changes on the consumer\'s say-so when controlled', async () => {
    const onValueChange = jest.fn();
    await render(<Input testID="input" value="fixed" onValueChange={onValueChange} />);

    await changeText('input', 'typed');

    expect(onValueChange).toHaveBeenCalledWith('typed');
    expect(screen.getByTestId('input').props.value).toBe('fixed');
  });

  it('follows a controlled value that changes from outside', async () => {
    function Controlled() {
      const [value, setValue] = React.useState('one');
      return (
        <>
          <Input testID="input" value={value} onValueChange={setValue} />
          <Input testID="setter" value="" onValueChange={() => setValue('two')} />
        </>
      );
    }
    await render(<Controlled />);

    await changeText('setter', 'x');

    expect(screen.getByTestId('input').props.value).toBe('two');
  });

  it('picks up a surrounding Field: label, description and disabled', async () => {
    await render(
      <Field.Root disabled>
        <Field.Label testID="label">Email</Field.Label>
        <Input testID="input" />
        <Field.Description testID="description">Work address</Field.Description>
      </Field.Root>,
    );

    const input = screen.getByTestId('input');
    expect(input.props.accessibilityLabelledBy).toBe(screen.getByTestId('label').props.nativeID);
    expect(input.props.accessibilityDescribedBy).toBe(
      screen.getByTestId('description').props.nativeID,
    );
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('reports itself invalid once the field validation fails', async () => {
    await render(
      <Field.Root validate={(value) => (value === 'bad' ? 'Nope' : null)}>
        <Input testID="input" />
        <Field.Error testID="error" />
      </Field.Root>,
    );

    expect(screen.getByTestId('input').props['aria-invalid']).toBeUndefined();

    await changeText('input', 'bad');
    await blur('input');

    expect(screen.getByTestId('input').props['aria-invalid']).toBe(true);
  });

  it('ignores typing while its field is disabled', async () => {
    const onValueChange = jest.fn();

    await render(
      <Field.Root disabled>
        <Input testID="input" onValueChange={onValueChange} />
      </Field.Root>,
    );

    await changeText('input', 'nope');

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('exposes disabled through a style function', async () => {
    const seen: boolean[] = [];

    await render(
      <Field.Root disabled>
        <Input
          testID="input"
          style={(state) => {
            seen.push(state.disabled);
            return undefined;
          }}
        />
      </Field.Root>,
    );

    expect(seen.at(-1)).toBe(true);
  });
});
