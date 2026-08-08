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

export function RadioDemo() {
  const [value, setValue] = useState('apple');

  return (
    <View style={s.stage}>
      <RadioGroup value={value} onValueChange={setValue} style={{ gap: 10 }}>
        {['apple', 'banana', 'cherry'].map((fruit) => (
          <View key={fruit} style={s.row}>
            <Radio.Root value={fruit} style={outer}>
              <Radio.Indicator style={inner} />
            </Radio.Root>
            <Text style={s.label}>{fruit}</Text>
          </View>
        ))}
      </RadioGroup>
      <Text style={s.muted}>Value: {value}</Text>
    </View>
  );
}
