'use client';

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ContextMenu } from '@limonify/zest-ui';
import { c, s } from './styles';

export function ContextMenuDemo() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <View style={s.stage}>
      <ContextMenu.Root>
        <ContextMenu.Trigger
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderStyle: 'dashed',
            borderRadius: 12,
            paddingVertical: 28,
            alignItems: 'center',
          }}
        >
          <Text style={s.label}>Long-press this card</Text>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Backdrop style={StyleSheet.absoluteFill} />
          <ContextMenu.Positioner>
            <ContextMenu.Popup style={s.popup}>
              {['Copy', 'Duplicate', 'Delete'].map((action) => (
                <ContextMenu.Item
                  key={action}
                  onPress={() => setLast(action)}
                  style={(state) => [s.item, state.pressed && s.itemPressed]}
                >
                  <Text style={[s.label, action === 'Delete' && { color: c.danger }]}>{action}</Text>
                </ContextMenu.Item>
              ))}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <Text style={s.muted}>
        It opens where the press landed, not against a trigger. Last action: {last ?? '—'}
      </Text>
    </View>
  );
}
