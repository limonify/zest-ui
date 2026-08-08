'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Toggle, ToggleGroup } from '@limonify/zest-ui';
import { c, s } from './styles';

const chip = {
  borderWidth: 1,
  borderColor: c.border,
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 8,
};
const chipOn = { backgroundColor: c.accent, borderColor: c.accent };

export function ToggleGroupDemo() {
  const [align, setAlign] = useState<string[]>(['left']);
  const [formatting, setFormatting] = useState<string[]>(['bold', 'italic']);

  return (
    <View style={s.stage}>
      <Text style={s.muted}>Single — one at a time</Text>
      <ToggleGroup value={align} onValueChange={setAlign} style={s.row}>
        {['left', 'center', 'right'].map((item) => (
          <Toggle key={item} value={item} style={(state) => [chip, state.pressed && chipOn]}>
            <Text style={align.includes(item) ? s.buttonText : s.label}>{item}</Text>
          </Toggle>
        ))}
      </ToggleGroup>

      <Text style={s.muted}>Multiple — any number</Text>
      <ToggleGroup multiple value={formatting} onValueChange={setFormatting} style={s.row}>
        {['bold', 'italic', 'underline'].map((item) => (
          <Toggle key={item} value={item} style={(state) => [chip, state.pressed && chipOn]}>
            <Text style={formatting.includes(item) ? s.buttonText : s.label}>{item}</Text>
          </Toggle>
        ))}
      </ToggleGroup>
    </View>
  );
}
