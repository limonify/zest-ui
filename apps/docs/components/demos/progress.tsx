'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Progress } from '@limonify/zest-ui';
import { c, s } from './styles';

const bar = { height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' as const };
const fill = { height: 8, borderRadius: 4, backgroundColor: c.accent };

export function ProgressDemo() {
  const [value, setValue] = useState(30);

  return (
    <View style={s.stage}>
      <Progress.Root value={value}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Progress.Label style={s.label}>Uploading</Progress.Label>
          <Progress.Value style={s.muted} />
        </View>
        <Progress.Track style={[bar, { marginTop: 8 }]}>
          <Progress.Indicator
            style={(state) => [fill, state.status === 'complete' && { backgroundColor: '#16a34a' }]}
          />
        </Progress.Track>
      </Progress.Root>

      <View style={s.row}>
        <Button
          onPress={() => setValue((v) => Math.max(0, v - 25))}
          style={(state) => [s.button, state.pressed && s.buttonPressed]}
        >
          <Text style={s.buttonText}>−25</Text>
        </Button>
        <Button
          onPress={() => setValue((v) => Math.min(100, v + 25))}
          style={(state) => [s.button, state.pressed && s.buttonPressed]}
        >
          <Text style={s.buttonText}>+25</Text>
        </Button>
      </View>
    </View>
  );
}
