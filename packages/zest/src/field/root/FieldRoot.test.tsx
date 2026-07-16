import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Field, Fieldset, Input } from '../../index';

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
