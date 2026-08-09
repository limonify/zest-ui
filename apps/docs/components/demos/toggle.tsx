'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Toggle, ToggleGroup } from '@limonify/zest-ui';
import { c, s } from './styles';

const chip = {
  borderWidth: 1,
  borderColor: c.border,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
};
const chipOn = { backgroundColor: c.accent, borderColor: c.accent };

export function ToggleDemo() {
  const [formatting, setFormatting] = useState<string[]>(['bold']);

  return (
    <View style={s.stage}>
      <ToggleGroup multiple value={formatting} onValueChange={setFormatting} style={s.row}>
        {['bold', 'italic', 'underline'].map((item) => (
          <Toggle key={item} value={item} style={(state) => [chip, state.pressed && chipOn]}>
            <Text style={formatting.includes(item) ? s.buttonText : s.label}>{item}</Text>
          </Toggle>
        ))}
      </ToggleGroup>
      <Text style={s.muted}>Pressed: [{formatting.join(', ')}]</Text>
    </View>
  );
}
