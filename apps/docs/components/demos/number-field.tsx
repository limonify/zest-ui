'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { NumberField } from '@limonify/zest-ui';
import { c, s } from './styles';

const stepper = {
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: c.accent,
  borderRadius: 8,
};
const group = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 };
const input = { ...s.control, minWidth: 90, textAlign: 'center' as const };

export function NumberFieldDemo() {
  const [value, setValue] = useState<number | null>(2);

  return (
    <View style={s.stage}>
      <NumberField.Root value={value} onValueChange={setValue} min={0} max={20}>
        <View style={s.row}>
          <NumberField.ScrubArea style={{ padding: 10 }}>
            <Text style={s.label}>✥</Text>
          </NumberField.ScrubArea>

          <NumberField.Group style={group}>
            <NumberField.Decrement
              style={(state) => [
                stepper,
                state.pressed && s.buttonPressed,
                state.disabled && s.buttonDisabled,
              ]}
            >
              <Text style={s.buttonText}>−</Text>
            </NumberField.Decrement>
            <NumberField.Input style={input} />
            <NumberField.Increment
              style={(state) => [
                stepper,
                state.pressed && s.buttonPressed,
                state.disabled && s.buttonDisabled,
              ]}
            >
              <Text style={s.buttonText}>+</Text>
            </NumberField.Increment>
          </NumberField.Group>
        </View>
      </NumberField.Root>
      <Text style={s.muted}>
        Drag the ✥ handle sideways to scrub the value, or hold a stepper to repeat.
      </Text>
    </View>
  );
}
