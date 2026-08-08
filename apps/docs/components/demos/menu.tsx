'use client';

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Menu } from '@limonify/zest-ui';
import { s } from './styles';

export function MenuDemo() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <View style={s.stage}>
      <Menu.Root>
        <Menu.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Open menu</Text>
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Backdrop style={StyleSheet.absoluteFill} />
          <Menu.Positioner side="bottom" align="start" sideOffset={6}>
            <Menu.Popup style={s.popup}>
              <Menu.Group>
                <Menu.GroupLabel style={s.muted}>Actions</Menu.GroupLabel>
                {['Duplicate', 'Rename', 'Archive'].map((action) => (
                  <Menu.Item
                    key={action}
                    onPress={() => setLast(action)}
                    style={(state) => [s.item, state.pressed && s.itemPressed]}
                  >
                    <Text style={s.label}>{action}</Text>
                  </Menu.Item>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Text style={s.muted}>Last action: {last ?? '—'}</Text>
    </View>
  );
}
