'use client';

import { View } from 'react-native';
import { Field } from '@limonify/zest-ui';
import { c, s } from './styles';

export function FieldDemo() {
  return (
    <View style={s.stage}>
      <Field.Root
        validate={(value) =>
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value ?? '')) ? null : 'Enter a valid email'
        }
      >
        <Field.Label style={s.muted}>Email</Field.Label>
        <Field.Control
          placeholder="you@example.com"
          autoCapitalize="none"
          style={(state) => [
            s.control,
            { marginTop: 6 },
            state.focused && { borderColor: c.accent },
            state.valid === false && { borderColor: c.danger },
          ]}
        />
        <Field.Description style={[s.muted, { marginTop: 6 }]}>
          We only use it to sign you in.
        </Field.Description>
        <Field.Error style={[s.muted, { color: c.danger, marginTop: 4 }]} />
      </Field.Root>
    </View>
  );
}
