'use client';

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Menu } from '@limonify/zest-ui';
import { FollowScroll } from './follow-scroll';
import { c, s } from './styles';

export function MenuDemo() {
  const [last, setLast] = useState<string | null>(null);
  const [showNumbers, setShowNumbers] = useState(true);

  return (
    <View style={s.stage}>
      <Menu.Root>
        <Menu.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Open menu</Text>
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Backdrop style={StyleSheet.absoluteFill} />
          <FollowScroll>
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

                <Menu.Separator style={{ height: 1, backgroundColor: c.border }} />

                <Menu.CheckboxItem
                  checked={showNumbers}
                  onCheckedChange={setShowNumbers}
                  style={(state) => [s.item, state.pressed && s.itemPressed]}
                >
                  <Text style={s.label}>Show line numbers</Text>
                  <Menu.CheckboxItemIndicator>
                    <Text style={s.label}>✓</Text>
                  </Menu.CheckboxItemIndicator>
                </Menu.CheckboxItem>

                <Menu.Item
                  disabled
                  style={(state) => [s.item, state.disabled && s.buttonDisabled]}
                >
                  <Text style={s.muted}>Delete — disabled</Text>
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </FollowScroll>
        </Menu.Portal>
      </Menu.Root>
      <Text style={s.muted}>
        Last action: {last ?? '—'} · Line numbers: {showNumbers ? 'on' : 'off'}
      </Text>
    </View>
  );
}
