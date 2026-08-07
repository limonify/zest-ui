import * as React from 'react';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Checkbox, Field, Form, RadioGroup, Radio, Select, Switch } from '../index';

/**
 * Controls that are not text inputs reach a form through
 * `useFieldControlRegistration`. Several of them call that hook twice — once at
 * the root, where the value lives, and once at the element, only for the
 * accessibility props. Only the first may register with the field: the second
 * has no value, so if it registered too, the form would validate the control
 * against `undefined` and a perfectly valid control could never submit.
 */
function submitProbe(children: React.ReactNode) {
  const onSubmit = jest.fn();
  const actionsRef = React.createRef<Form.Actions>();

  return {
    onSubmit,
    actionsRef,
    element: (
      <Form actionsRef={actionsRef} onSubmit={onSubmit}>
        {children}
      </Form>
    ),
  };
}

const required = (value: unknown) => (value ? null : 'Required');

describe('Form with non-text controls', () => {
  it('submits a Select that has a value', async () => {
    const { onSubmit, actionsRef, element } = submitProbe(
      <Field.Root name="fruit" validate={required}>
        <Select.Root defaultValue="apple">
          <Select.Trigger testID="trigger">
            <Select.Value />
          </Select.Trigger>
        </Select.Root>
        <Field.Error testID="error" />
      </Field.Root>,
    );

    await render(element);
    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(screen.queryByTestId('error')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('stops on a Select that has none', async () => {
    const { onSubmit, actionsRef, element } = submitProbe(
      <Field.Root name="fruit" validate={required}>
        <Select.Root>
          <Select.Trigger testID="trigger">
            <Select.Value />
          </Select.Trigger>
        </Select.Root>
        <Field.Error testID="error" />
      </Field.Root>,
    );

    await render(element);
    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates the field once per submit, not once per registration', async () => {
    const validate = jest.fn(() => null);
    const { actionsRef, element } = submitProbe(
      <Field.Root name="fruit" validate={validate}>
        <Select.Root defaultValue="apple">
          <Select.Trigger testID="trigger">
            <Select.Value />
          </Select.Trigger>
        </Select.Root>
      </Field.Root>,
    );

    await render(element);
    validate.mockClear();

    await act(async () => {
      actionsRef.current!.submit();
    });

    // `Select` registers at the root and again at the trigger for the a11y
    // props; only the root owns the value, so only it validates.
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith('apple');
  });

  it('submits a checked Checkbox and a Switch', async () => {
    const { onSubmit, actionsRef, element } = submitProbe(
      <>
        <Field.Root name="terms" validate={required}>
          <Checkbox.Root testID="terms" defaultChecked />
        </Field.Root>
        <Field.Root name="alerts" validate={required}>
          <Switch.Root testID="alerts" defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
        </Field.Root>
      </>,
    );

    await render(element);
    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('follows a RadioGroup as the user picks', async () => {
    const { onSubmit, actionsRef, element } = submitProbe(
      <Field.Root name="plan" validate={required}>
        <RadioGroup>
          <Radio.Root testID="free" value="free" />
          <Radio.Root testID="pro" value="pro" />
        </RadioGroup>
        <Field.Error testID="error" />
      </Field.Root>,
    );

    await render(element);
    await act(async () => {
      actionsRef.current!.submit();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('pro'));

    await act(async () => {
      actionsRef.current!.submit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
