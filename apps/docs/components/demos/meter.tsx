'use client';

import { View } from 'react-native';
import { Meter } from '@limonify/zest-ui';
import { c, s } from './styles';

const bar = { height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' as const };
const fill = { height: 8, borderRadius: 4, backgroundColor: c.accent };

export function MeterDemo() {
  return (
    <View style={s.stage}>
      <Meter.Root value={72}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Meter.Label style={s.label}>Storage used</Meter.Label>
          <Meter.Value style={s.muted} />
        </View>
        <Meter.Track style={[bar, { marginTop: 8 }]}>
          <Meter.Indicator style={fill} />
        </Meter.Track>
      </Meter.Root>
    </View>
  );
}
