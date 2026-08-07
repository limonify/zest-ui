import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Autocomplete, Combobox, Field, Form } from '../../index';

const FRUITS = ['Apple', 'Banana', 'Cherry'];

function FieldCombobox(props: Partial<React.ComponentProps<typeof Combobox.Root>> & {
  fieldDisabled?: boolean;
  validate?: (value: unknown) => string | null;
}) {
  const { fieldDisabled, validate, ...rootProps } = props;

  return (
    <Field.Root name="fruit" disabled={fieldDisabled} validate={validate}>
      <Field.Label testID="label">Fruit</Field.Label>
      <Combobox.Root items={FRUITS} {...rootProps}>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item key={String(item.value)} testID={`item-${item.value}`} item={item}>
                    <Text>{item.label}</Text>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <Field.Description testID="description">Pick one</Field.Description>
      <Field.Error testID="error" />
    </Field.Root>
  );
}

describe('Combobox inside a Field', () => {
  it('is labelled and described by the field', async () => {
    await render(<FieldCombobox />);

    const input = screen.getByTestId('input');
    expect(input.props.accessibilityLabelledBy).toBe(screen.getByTestId('label').props.nativeID);
    expect(input.props.accessibilityDescribedBy).toContain(
      screen.getByTestId('description').props.nativeID,
    );
  });

  it('inherits the field disabled state', async () => {
    await render(<FieldCombobox fieldDisabled />);

    expect(screen.getByTestId('input').props.editable).toBe(false);
  });

  it('runs the field validation when a value is chosen', async () => {
    const validate = jest.fn(() => null);
    await render(
      <FieldCombobox defaultOpen validate={validate} />,
    );

    validate.mockClear();
    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-Banana'));

    // Choosing closes the list, which is a combobox's blur — the moment
    // `validationMode: 'onBlur'` validates.
    expect(validate).toHaveBeenCalledWith('Banana');
  });

  it('reports focus to the field', async () => {
    const styleFn = jest.fn(() => undefined);

    await render(
      <Field.Root name="fruit">
        <Field.Label style={styleFn}>Fruit</Field.Label>
        <Combobox.Root items={FRUITS} openOnFocus={false}>
          <Combobox.Input testID="input" />
        </Combobox.Root>
      </Field.Root>,
    );

    await act(async () => {
      fireEvent(screen.getByTestId('input'), 'focus');
    });
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ focused: true }));

    await act(async () => {
      fireEvent(screen.getByTestId('input'), 'blur');
    });
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ focused: false }));
  });

  it('marks the input invalid when the field is', async () => {
    const actionsRef = React.createRef<Form.Actions>();

    await render(
      <Form actionsRef={actionsRef}>
        <FieldCombobox validate={(value) => (value ? null : 'Pick a fruit')} />
      </Form>,
    );

    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Pick a fruit');
    expect(screen.getByTestId('input').props['aria-invalid']).toBe(true);
  });
});

const required = (value: unknown) => (value ? null : 'Required');

describe('Combobox inside a Form', () => {
  it('stops submission when nothing is selected', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();

    await render(
      <Form actionsRef={actionsRef} onSubmit={onSubmit}>
        <FieldCombobox validate={required} />
      </Form>,
    );

    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('error')).toHaveTextContent('Required');
  });

  it('submits once a value is selected', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();

    await render(
      <Form actionsRef={actionsRef} onSubmit={onSubmit}>
        <FieldCombobox defaultValue="Apple" validate={required} />
      </Form>,
    );

    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('validates the field once, not once per part', async () => {
    const validate = jest.fn(() => null);
    const actionsRef = React.createRef<Form.Actions>();

    await render(
      <Form actionsRef={actionsRef}>
        <FieldCombobox defaultValue="Apple" validate={validate} />
      </Form>,
    );

    validate.mockClear();
    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith('Apple');
  });
});

describe('Autocomplete inside a Field', () => {
  it('treats the typed text as its value', async () => {
    const validate = jest.fn(() => null);

    await render(
      <Field.Root name="tag" validate={validate} validationMode="onChange">
        <Field.Label testID="label">Tag</Field.Label>
        <Autocomplete.Root items={['bug', 'docs']}>
          <Autocomplete.Input testID="input" />
        </Autocomplete.Root>
      </Field.Root>,
    );

    expect(screen.getByTestId('input').props.accessibilityLabelledBy).toBe(
      screen.getByTestId('label').props.nativeID,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'bu');
    });

    expect(validate).toHaveBeenCalledWith('bu');
  });

  it('submits the typed text through a form', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();

    await render(
      <Form actionsRef={actionsRef} onSubmit={onSubmit}>
        <Field.Root name="tag" validate={(value) => (value ? null : 'Required')}>
          <Autocomplete.Root items={['bug', 'docs']}>
            <Autocomplete.Input testID="input" />
          </Autocomplete.Root>
          <Field.Error testID="error" />
        </Field.Root>
      </Form>,
    );

    await act(async () => {
      actionsRef.current!.submit();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('input'), 'bug');
    });
    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('outside a Field', () => {
  it('is unaffected', async () => {
    await render(
      <Combobox.Root items={FRUITS}>
        <Combobox.Input testID="input" />
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    expect(input.props.editable).toBe(true);
    expect(input.props.accessibilityLabelledBy).toBeUndefined();
  });
});
