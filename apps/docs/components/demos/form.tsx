'use client';

import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Field, Form } from '@limonify/zest-ui';
import { c, s } from './styles';

const control = (state: { focused?: boolean; valid?: boolean | null }) => [
  s.control,
  state.focused && { borderColor: c.accent },
  state.valid === false && { borderColor: c.danger },
];

export function FormDemo() {
  const form = useRef<Form.Actions>(null);
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(0);

  return (
    <View style={s.stage}>
      <Form
        actionsRef={form}
        errors={errors}
        onClearErrors={setErrors}
        onSubmit={() => setSubmitted((n) => n + 1)}
        style={{ gap: 12 }}
      >
        <Field.Root
          name="email"
          validate={(value) => (String(value ?? '').includes('@') ? null : 'Enter a valid email')}
        >
          <Field.Label style={s.muted}>Email</Field.Label>
          <Field.Control placeholder="you@example.com" autoCapitalize="none" style={control} />
          <Field.Error style={[s.muted, { color: c.danger }]} />
        </Field.Root>

        <Field.Root
          name="name"
          validate={(value) => (String(value ?? '').length > 0 ? null : 'Name is required')}
        >
          <Field.Label style={s.muted}>Name</Field.Label>
          <Field.Control placeholder="Eren" style={control} />
          <Field.Error style={[s.muted, { color: c.danger }]} />
        </Field.Root>
      </Form>

      <View style={s.row}>
        <Button
          onPress={() => form.current?.submit()}
          style={(state) => [s.button, state.pressed && s.buttonPressed]}
        >
          <Text style={s.buttonText}>Submit</Text>
        </Button>
        <Button
          onPress={() => setErrors({ email: 'That address is already taken' })}
          style={(state) => [s.button, state.pressed && s.buttonPressed]}
        >
          <Text style={s.buttonText}>Server error</Text>
        </Button>
      </View>

      <Text style={s.muted}>
        Submitting validates every field and sends you to the first that failed. Submitted{' '}
        {submitted} times.
      </Text>
    </View>
  );
}
