'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Checkbox, CheckboxGroup } from '@limonify/zest-ui';
import { s } from './styles';

const COLORS = ['red', 'green', 'blue'];

export function CheckboxGroupDemo() {
  const [value, setValue] = useState<string[]>(['red']);

  return (
    <View style={s.stage}>
      <CheckboxGroup allValues={COLORS} value={value} onValueChange={setValue} style={{ gap: 10 }}>
        <View style={s.row}>
          <Checkbox.Root parent style={(state) => [s.box, state.checked && s.boxChecked]}>
            <Checkbox.Indicator>
              {/* The parent reports a mixed state while only some children are ticked. */}
              <Text style={s.tick}>{value.length === COLORS.length ? '✓' : '–'}</Text>
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Text style={s.label}>Select all</Text>
        </View>

        {COLORS.map((color) => (
          <View key={color} style={[s.row, { paddingLeft: 24 }]}>
            <Checkbox.Root value={color} style={(state) => [s.box, state.checked && s.boxChecked]}>
              <Checkbox.Indicator>
                <Text style={s.tick}>✓</Text>
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Text style={s.label}>{color}</Text>
          </View>
        ))}
      </CheckboxGroup>
      <Text style={s.muted}>Value: [{value.join(', ')}]</Text>
    </View>
  );
}
