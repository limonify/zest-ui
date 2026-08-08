'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Checkbox } from '@limonify/zest-ui';
import { s } from './styles';

export function CheckboxDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <View style={s.stage}>
      <View style={s.row}>
        <Checkbox.Root
          checked={checked}
          onCheckedChange={setChecked}
          style={(state) => [s.box, state.checked && s.boxChecked]}
        >
          <Checkbox.Indicator>
            <Text style={s.tick}>✓</Text>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Text style={s.label}>Controlled — {checked ? 'checked' : 'unchecked'}</Text>
      </View>

      <View style={s.row}>
        <Checkbox.Root
          defaultChecked
          style={(state) => [s.box, state.checked && s.boxChecked]}
        >
          <Checkbox.Indicator>
            <Text style={s.tick}>✓</Text>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Text style={s.label}>Uncontrolled, with defaultChecked</Text>
      </View>

      <View style={s.row}>
        <Checkbox.Root
          disabled
          defaultChecked
          style={(state) => [s.box, state.checked && s.boxChecked, state.disabled && s.buttonDisabled]}
        >
          <Checkbox.Indicator>
            <Text style={s.tick}>✓</Text>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Text style={s.muted}>Disabled</Text>
      </View>
    </View>
  );
}
