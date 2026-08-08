'use client';

import { Text, View } from 'react-native';
import { Separator } from '@limonify/zest-ui';
import { c, s } from './styles';

export function SeparatorDemo() {
  return (
    <View style={s.stage}>
      <Text style={s.label}>Above</Text>
      <Separator style={{ height: 1, backgroundColor: c.border }} />
      <Text style={s.label}>Below</Text>

      <View style={[s.row, { height: 40 }]}>
        <Text style={s.label}>Left</Text>
        <Separator
          orientation="vertical"
          style={{ width: 1, alignSelf: 'stretch', backgroundColor: c.border }}
        />
        <Text style={s.label}>Right</Text>
      </View>
    </View>
  );
}
