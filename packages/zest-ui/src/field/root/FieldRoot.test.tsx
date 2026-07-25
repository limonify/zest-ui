import * as React from 'react';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Checkbox, Field, Fieldset, Input, OTPField, RadioGroup, Radio, Select, Slider, Switch } from '../../index';

const hidden = { includeHiddenElements: true } as const;

/** RTL v14 + React 19: state updates from an event only flush inside an async act. */
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

async function focus(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), 'focus');
  });
}

describe('Field', () => {
  it('associates the label and description with the control', async () => {
    await render(
      <Field.Root>
        <Field.Label testID="label">Email</Field.Label>
        <Field.Control testID="control" />
        <Field.Description testID="description">We never share it.</Field.Description>
      </Field.Root>,
    );

    const control = screen.getByTestId('control');
    const labelId = screen.getByTestId('label').props.nativeID;
    const descriptionId = screen.getByTestId('description').props.nativeID;

    expect(labelId).toBeTruthy();
    expect(control.props.accessibilityLabelledBy).toBe(labelId);
    expect(control.props.accessibilityDescribedBy).toContain(descriptionId);
  });

  it('validates on blur and shows the error', async () => {
    await render(
      <Field.Root validate={(value) => ((value as string).length < 3 ? 'Too short' : null)}>
        <Field.Control testID="control" defaultValue="ab" />
        <Field.Error testID="error" />
      </Field.Root>,
    );

    expect(screen.queryByTestId('error', hidden)).toBeNull();

    await blur('control');

    const error = screen.getByTestId('error', hidden);
    expect(error).toHaveTextContent('Too short');
  });

  it('clears the error once the value becomes valid (onChange mode)', async () => {
    await render(
      <Field.Root
        validationMode="onChange"
        validate={(value) => ((value as string).length < 3 ? 'Too short' : null)}
      >
        <Field.Control testID="control" defaultValue="" />
        <Field.Error testID="error" />
      </Field.Root>,
    );

    await changeText('control', 'a');
    expect(screen.getByTestId('error', hidden)).toHaveTextContent('Too short');

    await changeText('control', 'abc');
    expect(screen.queryByTestId('error', hidden)).toBeNull();
  });

  it('marks the control invalid for assistive technology', async () => {
    await render(
      <Field.Root validationMode="onChange" validate={() => 'Nope'}>
        <Field.Control testID="control" />
      </Field.Root>,
    );

    await changeText('control', 'x');
    expect(screen.getByTestId('control').props['aria-invalid']).toBe(true);
  });

  it('exposes filled/dirty/focused/touched through a style function', async () => {
    const seen: Field.Root.State[] = [];
    await render(
      <Field.Root>
        <Field.Control testID="control" />
        <Field.Description style={(state) => { seen.push(state); return null; }}>
          x
        </Field.Description>
      </Field.Root>,
    );

    await focus('control');
    await changeText('control', 'hi');
    await blur('control');

    const last = seen[seen.length - 1]!;
    expect(last.filled).toBe(true);
    expect(last.dirty).toBe(true);
    expect(last.touched).toBe(true);
  });

  it('disables the control when the field is disabled', async () => {
    await render(
      <Field.Root disabled>
        <Field.Control testID="control" />
      </Field.Root>,
    );

    expect(screen.getByTestId('control').props.editable).toBe(false);
  });

  it('a Fieldset disables every field inside it', async () => {
    await render(
      <Fieldset.Root disabled>
        <Fieldset.Legend testID="legend">Address</Fieldset.Legend>
        <Field.Root>
          <Field.Control testID="control" />
        </Field.Root>
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('control').props.editable).toBe(false);
    expect(screen.getByTestId('legend').props.nativeID).toBeTruthy();
  });

  it('exposes validity through Field.Validity', async () => {
    let seen: Field.Validity.State | undefined;
    await render(
      <Field.Root validationMode="onChange" validate={(v) => ((v as string) ? null : 'Required')}>
        <Field.Control testID="control" />
        <Field.Validity>
          {(validity) => {
            seen = validity;
            return null;
          }}
        </Field.Validity>
      </Field.Root>,
    );

    await changeText('control', '');
    expect(seen?.valid).toBe(false);
    expect(seen?.errors).toContain('Required');
  });
});

describe('Field integration with form controls', () => {
  it('labels a Checkbox with Field.Label', async () => {
    await render(
      <Field.Root>
        <Field.Label testID="label">Accept terms</Field.Label>
        <Checkbox.Root testID="checkbox" />
      </Field.Root>,
    );

    const labelId = screen.getByTestId('label').props.nativeID;
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId('checkbox').props.accessibilityLabelledBy).toBe(labelId);
  });

  it('a disabled Field disables the Checkbox and Switch inside it', async () => {
    await render(
      <Field.Root disabled>
        <Checkbox.Root testID="checkbox" />
        <Switch.Root testID="switch" />
      </Field.Root>,
    );

    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByTestId('switch').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('runs the field validate when a Checkbox toggles', async () => {
    await render(
      <Field.Root
        validationMode="onChange"
        validate={(checked) => (checked ? null : 'Required')}
      >
        <Checkbox.Root testID="checkbox" />
        <Field.Error testID="error" />
      </Field.Root>,
    );

    const user = userEvent.setup();
    // Toggle on then off, so the last change is invalid.
    await user.press(screen.getByTestId('checkbox'));
    await user.press(screen.getByTestId('checkbox'));

    expect(screen.getByTestId('error', hidden)).toHaveTextContent('Required');
  });
});

describe('Input', () => {
  it('works standalone, without a Field', async () => {
    await render(<Input testID="input" defaultValue="hi" />);
    expect(screen.getByTestId('input').props.value).toBe('hi');
    expect(screen.getByTestId('input').props.editable).toBe(true);
  });

  it('picks up a surrounding Field', async () => {
    await render(
      <Field.Root>
        <Field.Label testID="label">Name</Field.Label>
        <Input testID="input" />
      </Field.Root>,
    );

    const labelId = screen.getByTestId('label').props.nativeID;
    expect(screen.getByTestId('input').props.accessibilityLabelledBy).toBe(labelId);
  });
});

describe('Field bookkeeping for non-text controls', () => {
  /** Renders the field's own state as text so a test can read it. */
  function Bookkeeping() {
    return (
      <Field.Validity>
        {(validity) => (
          <Field.Description testID="state">
            {`dirty:${validity.field.dirty} touched:${validity.field.touched} filled:${validity.field.filled}`}
          </Field.Description>
        )}
      </Field.Validity>
    );
  }

  function fieldState() {
    return screen.getByTestId('state').props.children;
  }

  it('a Checkbox makes the field dirty, filled and touched', async () => {
    await render(
      <Field.Root>
        <Checkbox.Root testID="checkbox" />
        <Bookkeeping />
      </Field.Root>,
    );

    expect(fieldState()).toBe('dirty:false touched:false filled:false');

    const user = userEvent.setup();
    await user.press(screen.getByTestId('checkbox'));

    expect(fieldState()).toBe('dirty:true touched:true filled:true');
  });

  it('unchecking again leaves the field touched but no longer dirty', async () => {
    await render(
      <Field.Root>
        <Checkbox.Root testID="checkbox" />
        <Bookkeeping />
      </Field.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('checkbox'));
    await user.press(screen.getByTestId('checkbox'));

    expect(fieldState()).toBe('dirty:false touched:true filled:false');
  });

  it('a Switch reports the same way', async () => {
    await render(
      <Field.Root>
        <Switch.Root testID="switch" />
        <Bookkeeping />
      </Field.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('switch'));

    expect(fieldState()).toBe('dirty:true touched:true filled:true');
  });

  it('a RadioGroup reports its selection', async () => {
    await render(
      <Field.Root>
        <RadioGroup testID="group">
          <Radio.Root testID="radio-a" value="a" />
          <Radio.Root testID="radio-b" value="b" />
        </RadioGroup>
        <Bookkeeping />
      </Field.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('radio-b'));

    expect(fieldState()).toBe('dirty:true touched:true filled:true');
  });

  it('a Select reports its selection, and closing counts as leaving it', async () => {
    await render(
      <Field.Root>
        <Select.Root defaultOpen>
          <Select.Trigger testID="trigger" />
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item testID="item-a" value="a" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Bookkeeping />
      </Field.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-a'));

    expect(fieldState()).toBe('dirty:true touched:true filled:true');
  });

  it('an OTPField reports a completed code', async () => {
    await render(
      <Field.Root>
        <OTPField.Root length={2}>
          <OTPField.Input testID="slot-0" />
          <OTPField.Input testID="slot-1" />
        </OTPField.Root>
        <Bookkeeping />
      </Field.Root>,
    );

    await changeText('slot-0', '1');
    expect(fieldState()).toBe('dirty:true touched:false filled:true');

    await changeText('slot-1', '2');
    expect(fieldState()).toBe('dirty:true touched:true filled:true');
  });

  it('labels a Slider thumb with Field.Label', async () => {
    // Slider.Control uses a gesture, which needs the root view even in a test.
    await render(
      <GestureHandlerRootView>
        <Field.Root>
          <Field.Label testID="label">Volume</Field.Label>
          <Slider.Root>
            <Slider.Control>
              <Slider.Thumb testID="thumb" />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>
      </GestureHandlerRootView>,
    );

    const labelId = screen.getByTestId('label').props.nativeID;
    expect(screen.getByTestId('thumb').props.accessibilityLabelledBy).toBe(labelId);
  });

  it('a disabled Field disables a Slider, Select and OTPField inside it', async () => {
    await render(
      <GestureHandlerRootView>
        <Field.Root disabled>
          <Slider.Root>
            <Slider.Control>
              <Slider.Thumb testID="thumb" />
            </Slider.Control>
          </Slider.Root>
          <Select.Root>
            <Select.Trigger testID="trigger" />
          </Select.Root>
          <OTPField.Root length={1}>
            <OTPField.Input testID="slot-0" />
          </OTPField.Root>
        </Field.Root>
      </GestureHandlerRootView>,
    );

    expect(screen.getByTestId('thumb').props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId('slot-0').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
