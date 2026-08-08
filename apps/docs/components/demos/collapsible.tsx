'use client';

import { Text, View } from 'react-native';
import { Collapsible } from '@limonify/zest-ui';
import { s } from './styles';

export function CollapsibleDemo() {
  return (
    <View style={s.stage}>
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Toggle details</Text>
        </Collapsible.Trigger>
        <Collapsible.Panel>
          <Text style={[s.muted, { paddingTop: 10 }]}>
            The panel renders only while open, so it lays out at its natural height. It also
            publishes that measured height on state, which is what you animate against.
          </Text>
        </Collapsible.Panel>
      </Collapsible.Root>
    </View>
  );
}
