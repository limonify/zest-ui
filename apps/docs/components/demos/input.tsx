'use client';

import { View } from 'react-native';
import { Input } from '@limonify/zest-ui';
import { s } from './styles';

export function InputDemo() {
  return (
    <View style={s.stage}>
      <Input placeholder="Standalone input" style={s.control} />
      {/* `Input` takes its disabled state from a surrounding Field; on its own
          it is a TextInput, so `editable` is the lever. */}
      <Input placeholder="Read-only" editable={false} style={[s.control, s.buttonDisabled]} />
    </View>
  );
}
