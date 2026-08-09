'use client';

import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@limonify/zest-ui';
import { s } from './styles';

export function ButtonDemo() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <View style={s.stage}>
      <Button
        onPress={() => setCount((n) => n + 1)}
        style={(state) => [s.button, state.pressed && s.buttonPressed]}
      >
        <Text style={s.buttonText}>Pressed {count} times</Text>
      </Button>

      <Button
        disabled={loading}
        onPress={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1500);
        }}
        style={(state) => [
          s.button,
          state.pressed && s.buttonPressed,
          state.disabled && s.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={s.buttonText.color} />
        ) : (
          <Text style={s.buttonText}>Save</Text>
        )}
      </Button>

      <Button disabled style={(state) => [s.button, state.disabled && s.buttonDisabled]}>
        <Text style={s.buttonText}>Disabled</Text>
      </Button>
    </View>
  );
}
