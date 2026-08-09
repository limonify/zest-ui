'use client';

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Select } from '@limonify/zest-ui';
import { s } from './styles';

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

export function SelectDemo() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <View style={s.stage}>
      <Select.Root items={FRUITS} value={value} onValueChange={setValue}>
        <Select.Label style={s.muted}>Fruit</Select.Label>
        <Select.Trigger
          style={(state) => [s.control, s.row, s.selectTrigger, state.pressed && s.buttonPressed]}
        >
          <Select.Value style={s.label}>{(state) => state.label ?? 'Pick a fruit'}</Select.Value>
          <Select.Icon>
            <Text style={s.muted}>▾</Text>
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Backdrop style={StyleSheet.absoluteFill} />
          <Select.Positioner side="bottom" align="start" sideOffset={6}>
            {/* `triggerWidth` is the trigger's measured width, so the list lines
                up with the control that opened it. */}
            <Select.Popup
              style={(state) =>
                [s.popup, state.triggerWidth ? { minWidth: state.triggerWidth } : undefined]
              }
            >
              <Select.List>
                {FRUITS.map((fruit) => (
                  <Select.Item
                    key={fruit.value}
                    value={fruit.value}
                    style={(state) => [s.item, state.pressed && s.itemPressed]}
                  >
                    <Select.ItemText style={s.label}>{fruit.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Text style={s.label}>✓</Text>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </View>
  );
}
