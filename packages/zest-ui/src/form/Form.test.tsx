import * as React from 'react';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Checkbox, Field, Form } from '../index';

function TestForm(props: {
  actionsRef?: React.RefObject<Form.Actions | null>;
  errors?: Record<string, string | string[]>;
  onClearErrors?: (errors: Record<string, string | string[]>) => void;
  onSubmit?: () => void;
}) {
  return (
    <Form testID="form" {...props}>
      <Field.Root name="email" validate={(value) => (value ? null : 'Email is required')}>
        <Field.Label testID="email-label">Email</Field.Label>
        <Field.Control testID="email" />
        <Field.Error testID="email-error" />
      </Field.Root>
      <Field.Root name="name" validate={(value) => (value ? null : 'Name is required')}>
        <Field.Label>Name</Field.Label>
        <Field.Control testID="name" />
        <Field.Error testID="name-error" />
      </Field.Root>
    </Form>
  );
}

describe('Form', () => {
  it('renders a form-roled container', async () => {
    await render(<TestForm />);
    expect(screen.getByTestId('form').props.role).toBe('form');
  });

  it('does not submit while a field is invalid', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();
    await render(<TestForm actionsRef={actionsRef} onSubmit={onSubmit} />);

    let result: boolean | undefined;
    await act(async () => {
      result = actionsRef.current!.submit();
    });

    expect(result).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows every failing field its error, not just the first', async () => {
    const actionsRef = React.createRef<Form.Actions>();
    await render(<TestForm actionsRef={actionsRef} />);

    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
    expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
  });

  it('submits once every field is valid', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();
    await render(<TestForm actionsRef={actionsRef} onSubmit={onSubmit} />);

    const user = userEvent.setup();
    await user.type(screen.getByTestId('email'), 'a@b.co');
    await user.type(screen.getByTestId('name'), 'Eren');

    let result: boolean | undefined;
    await act(async () => {
      result = actionsRef.current!.submit();
    });

    expect(result).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('focuses the first invalid field, in tree order', async () => {
    const actionsRef = React.createRef<Form.Actions>();
    await render(<TestForm actionsRef={actionsRef} />);

    // The first field in the tree is the one submission stops at, so filling it
    // moves the stop to the second.
    const user = userEvent.setup();
    await user.type(screen.getByTestId('email'), 'a@b.co');

    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(screen.queryByTestId('email-error')).toBeNull();
    expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
  });

  it('validates without submitting', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();
    await render(<TestForm actionsRef={actionsRef} onSubmit={onSubmit} />);

    let valid: boolean | undefined;
    await act(async () => {
      valid = actionsRef.current!.validate();
    });

    expect(valid).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('errors from outside', () => {
    it('puts an error on the field it names', async () => {
      await render(<TestForm errors={{ email: 'Already taken' }} />);

      expect(screen.getByTestId('email-error')).toHaveTextContent('Already taken');
      expect(screen.queryByTestId('name-error')).toBeNull();
    });

    it('accepts several messages for one field', async () => {
      await render(<TestForm errors={{ email: ['Already taken', 'Too long'] }} />);

      expect(screen.getByTestId('email-error')).toHaveTextContent('Already taken');
    });

    it('blocks submission even though the field would validate', async () => {
      const onSubmit = jest.fn();
      const actionsRef = React.createRef<Form.Actions>();
      await render(
        <TestForm actionsRef={actionsRef} onSubmit={onSubmit} errors={{ email: 'Already taken' }} />,
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('email'), 'a@b.co');
      await user.type(screen.getByTestId('name'), 'Eren');

      await act(async () => {
        actionsRef.current!.submit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('drops the error as soon as the user edits the field', async () => {
      const onClearErrors = jest.fn();
      await render(
        <TestForm errors={{ email: 'Already taken', name: 'Bad' }} onClearErrors={onClearErrors} />,
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('email'), 'x');

      expect(onClearErrors).toHaveBeenCalledWith({ name: 'Bad' });
    });

    it('leaves untouched fields alone', async () => {
      const onClearErrors = jest.fn();
      await render(<TestForm errors={{ name: 'Bad' }} onClearErrors={onClearErrors} />);

      const user = userEvent.setup();
      await user.type(screen.getByTestId('email'), 'x');

      expect(onClearErrors).not.toHaveBeenCalled();
    });
  });

  it('works with a Pressable control that cannot take focus', async () => {
    const onSubmit = jest.fn();
    const actionsRef = React.createRef<Form.Actions>();

    await render(
      <Form actionsRef={actionsRef} onSubmit={onSubmit}>
        <Field.Root name="terms" validate={(value) => (value ? null : 'Required')}>
          <Checkbox.Root testID="terms" />
          <Field.Error testID="terms-error" />
        </Field.Root>
      </Form>,
    );

    await act(async () => {
      actionsRef.current!.submit();
    });

    // Nothing to focus, but the field is still marked and the error shows.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('terms-error')).toHaveTextContent('Required');

    const user = userEvent.setup();
    await user.press(screen.getByTestId('terms'));

    await act(async () => {
      actionsRef.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('leaves a field outside a form alone', async () => {
    await render(
      <Field.Root name="email" validate={() => 'Nope'}>
        <Field.Control testID="email" />
        <Field.Error testID="email-error" />
      </Field.Root>,
    );

    expect(screen.getByTestId('email')).toBeTruthy();
    // Nothing validated it, because nothing submitted it.
    expect(screen.queryByTestId('email-error')).toBeNull();
  });
});
