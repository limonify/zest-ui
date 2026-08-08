'use client';

import { View } from 'react-native';
import { Field, Fieldset } from '@limonify/zest-ui';
import { s } from './styles';

export function FieldsetDemo() {
  return (
    <View style={s.stage}>
      <Fieldset.Root disabled style={{ gap: 8 }}>
        <Fieldset.Legend style={s.heading}>Billing address (disabled)</Fieldset.Legend>
        <Field.Root>
          <Field.Control placeholder="Street" style={[s.control, s.buttonDisabled]} />
        </Field.Root>
        <Field.Root>
          <Field.Control placeholder="City" style={[s.control, s.buttonDisabled]} />
        </Field.Root>
      </Fieldset.Root>
    </View>
  );
}
