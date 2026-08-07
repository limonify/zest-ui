import * as React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Checkbox, CheckboxGroup, Field } from '../../index';

function TestItems(props: { disabled?: boolean; itemDisabled?: boolean }) {
  return (
    <Field.Root disabled={props.disabled}>
      <Field.Label testID="field-label">Notifications</Field.Label>
      <CheckboxGroup>
        <Field.Item testID="item-email" disabled={props.itemDisabled}>
          <Checkbox.Root testID="checkbox-email" value="email" />
          <Field.Label testID="label-email">Email</Field.Label>
          <Field.Description testID="description-email">At most one a day</Field.Description>
        </Field.Item>
        <Field.Item testID="item-sms">
          <Checkbox.Root testID="checkbox-sms" value="sms" />
          <Field.Label testID="label-sms">SMS</Field.Label>
        </Field.Item>
      </CheckboxGroup>
    </Field.Root>
  );
}

describe('Field.Item', () => {
  it('gives each item its own label, not the field-wide one', async () => {
    await render(<TestItems />);

    const emailLabel = screen.getByTestId('label-email').props.nativeID;
    const smsLabel = screen.getByTestId('label-sms').props.nativeID;
    const fieldLabel = screen.getByTestId('field-label').props.nativeID;

    expect(emailLabel).toBeTruthy();
    expect(emailLabel).not.toBe(smsLabel);
    expect(emailLabel).not.toBe(fieldLabel);

    expect(screen.getByTestId('checkbox-email').props.accessibilityLabelledBy).toBe(emailLabel);
    expect(screen.getByTestId('checkbox-sms').props.accessibilityLabelledBy).toBe(smsLabel);
  });

  it('scopes a description to its own item', async () => {
    await render(<TestItems />);

    const descriptionId = screen.getByTestId('description-email').props.nativeID;

    expect(screen.getByTestId('checkbox-email').props.accessibilityDescribedBy).toContain(
      descriptionId,
    );
    // The sibling item never registered it.
    expect(screen.getByTestId('checkbox-sms').props.accessibilityDescribedBy ?? '').not.toContain(
      descriptionId,
    );
  });

  it('inherits disabled from the field', async () => {
    await render(<TestItems disabled />);

    expect(screen.getByTestId('checkbox-email').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('checkbox-sms').props.accessibilityState.disabled).toBe(true);
  });

  it('can be disabled on its own without touching its siblings', async () => {
    await render(<TestItems itemDisabled />);

    expect(screen.getByTestId('checkbox-email').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('checkbox-sms').props.accessibilityState.disabled).toBe(false);
  });

  it('exposes the field state to style and render functions', async () => {
    const styleFn = jest.fn(() => ({}));

    await render(
      <Field.Root>
        <Field.Item testID="item" style={styleFn}>
          <Text>Item</Text>
        </Field.Item>
      </Field.Root>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ disabled: false, touched: false, dirty: false }),
    );
  });

  it('throws outside a field', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        render(
          <Field.Item>
            <Text>Item</Text>
          </Field.Item>,
        ),
      ).rejects.toThrow(/FieldRootContext is missing/);
    } finally {
      warn.mockRestore();
    }
  });
});
