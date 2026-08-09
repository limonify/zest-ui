'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Radio, RadioGroup } from '@limonify/zest-ui';
import { c, s } from './styles';

const outer = {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: c.accent,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const inner = { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent };

export function RadioGroupDemo() {
  const [value, setValue] = useState('standard');

  return (
    <View style={s.stage}>
      <Text style={s.heading}>Delivery</Text>
      <RadioGroup value={value} onValueChange={setValue} style={{ gap: 10 }}>
        {[
          { value: 'standard', label: 'Standard — 3 to 5 days' },
          { value: 'express', label: 'Express — next day' },
          { value: 'pickup', label: 'Collect in store' },
          { value: 'overnight', label: 'Overnight (disabled)', disabled: true },
        ].map((option) => (
          <View key={option.value} style={s.row}>
            <Radio.Root
              value={option.value}
              disabled={option.disabled}
              style={(state) => [outer, state.disabled && s.buttonDisabled]}
            >
              <Radio.Indicator style={inner} />
            </Radio.Root>
            <Text style={option.disabled ? s.muted : s.label}>{option.label}</Text>
          </View>
        ))}
      </RadioGroup>
      <Text style={s.muted}>
        A radio requires a group — without one there is no source of truth, so it throws.
      </Text>
    </View>
  );
}
