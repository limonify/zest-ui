import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Field, Radio, RadioGroup } from '../index';

function TestRadioGroup(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup testID="group" {...props}>
      <Radio.Root testID="radio-a" value="a">
        <Radio.Indicator testID="indicator-a" />
      </Radio.Root>
      <Radio.Root testID="radio-b" value="b">
        <Radio.Indicator testID="indicator-b" />
      </Radio.Root>
    </RadioGroup>
  );
}

const hidden = { includeHiddenElements: true } as const;

describe('RadioGroup', () => {
  it('announces itself as a radiogroup', async () => {
    await render(<TestRadioGroup />);

    expect(screen.getByTestId('group').props.accessibilityRole).toBe('radiogroup');
  });

  it('selects a radio and reports why', async () => {
    const onValueChange = jest.fn();
    await render(<TestRadioGroup onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('radio-b'));

    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('radio-b').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('radio-a').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('starts from defaultValue when uncontrolled', async () => {
    await render(<TestRadioGroup defaultValue="a" />);

    expect(screen.getByTestId('radio-a').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('only changes on the consumer\'s say-so when controlled', async () => {
    const onValueChange = jest.fn();
    await render(<TestRadioGroup value="a" onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('radio-b'));

    expect(onValueChange).toHaveBeenCalled();
    expect(screen.getByTestId('radio-a').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('lets onValueChange cancel the selection', async () => {
    await render(
      <TestRadioGroup
        onValueChange={(_value, details) => {
          details.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('radio-b'));

    expect(screen.getByTestId('radio-b').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('mounts the indicator only for the selected radio', async () => {
    await render(<TestRadioGroup defaultValue="a" />);

    expect(screen.getByTestId('indicator-a', hidden)).toBeTruthy();
    expect(screen.queryByTestId('indicator-b', hidden)).toBeNull();
  });

  it('disables every radio in the group', async () => {
    const onValueChange = jest.fn();
    await render(<TestRadioGroup disabled onValueChange={onValueChange} />);

    expect(screen.getByTestId('group').props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId('radio-a').props.accessibilityState).toMatchObject({ disabled: true });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('radio-a'));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ignores presses when read-only, and advertises it', async () => {
    const onValueChange = jest.fn();
    await render(<TestRadioGroup readOnly onValueChange={onValueChange} />);

    expect(screen.getByTestId('group').props['aria-readonly']).toBe(true);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('radio-a'));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('advertises required', async () => {
    await render(<TestRadioGroup required />);

    expect(screen.getByTestId('group').props['aria-required']).toBe(true);
  });

  it('publishes disabled, readOnly and required through a style function', async () => {
    const seen: Array<RadioGroup.State> = [];

    await render(
      <RadioGroup
        testID="group"
        disabled
        readOnly
        required
        style={(state) => {
          seen.push(state);
          return undefined;
        }}
      >
        <Radio.Root value="a" />
      </RadioGroup>,
    );

    expect(seen.at(-1)).toEqual({ disabled: true, readOnly: true, required: true });
  });

  it('picks up a surrounding Field for its label and disabled state', async () => {
    await render(
      <Field.Root disabled>
        <Field.Label testID="label">Plan</Field.Label>
        <TestRadioGroup />
      </Field.Root>,
    );

    expect(screen.getByTestId('group').props.accessibilityLabelledBy).toBe(
      screen.getByTestId('label').props.nativeID,
    );
    expect(screen.getByTestId('group').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('throws when a Radio is rendered without a group', async () => {
    await expect(
      render(
        <Radio.Root value="a">
          <Text>Orphan</Text>
        </Radio.Root>,
      ),
    ).rejects.toThrow(/RadioGroup/);
  });
});
