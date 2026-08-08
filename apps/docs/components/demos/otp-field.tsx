'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { OTPField } from '@limonify/zest-ui';
import { c, s } from './styles';

const slot = {
  width: 42,
  height: 52,
  borderWidth: 1,
  borderColor: c.border,
  borderRadius: 10,
  textAlign: 'center' as const,
  fontSize: 20,
  color: c.fg,
};

export function OTPFieldDemo() {
  const [completed, setCompleted] = useState<string | null>(null);

  return (
    <View style={s.stage}>
      <OTPField.Root length={6} onValueComplete={setCompleted} style={s.row}>
        {Array.from({ length: 6 }, (_, index) => (
          <OTPField.Input
            key={index}
            style={(state) => [slot, state.filled && { borderColor: c.accent }]}
          />
        ))}
      </OTPField.Root>
      <Text style={s.muted}>
        Pasting a code spreads it across every slot. Completed: {completed ?? '—'}
      </Text>
    </View>
  );
}
