'use client';

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Combobox } from '@limonify/zest-ui';
import { s } from './styles';

const CITIES = ['Berlin', 'Cairo', 'Delhi', 'Edinburgh', 'Lisbon', 'Madrid', 'Seoul', 'Tokyo'];

export function ComboboxDemo() {
  const [value, setValue] = useState<unknown>(null);

  return (
    <View style={s.stage}>
      <Text style={s.muted}>Selected: {String(value ?? '—')}</Text>

      <Combobox.Root items={CITIES} value={value} onValueChange={setValue}>
        <Combobox.Trigger style={(state) => [s.control, state.pressed && s.buttonPressed]}>
          <Combobox.Value placeholder="Pick a city" style={s.label} />
        </Combobox.Trigger>

        <Combobox.Portal>
          <Combobox.Backdrop style={StyleSheet.absoluteFill} />
          {/* `triggerWidth` is the anchor's measured width, so the list matches
              the control that opened it. */}
          <Combobox.Positioner
            style={(state) => (state.triggerWidth ? { width: state.triggerWidth } : undefined)}
          >
            <Combobox.Popup style={[s.popup, { maxHeight: 220 }]}>
              <Combobox.Input placeholder="Search" style={s.control} />
              <Combobox.Status style={s.muted} />
              <Combobox.Empty>
                <Text style={s.muted}>No match</Text>
              </Combobox.Empty>
              <Combobox.List render={(props) => <ScrollView {...props} />}>
                {(item) => (
                  <Combobox.Item
                    key={String(item.value)}
                    item={item}
                    style={(state) => [s.item, state.pressed && s.itemPressed]}
                  >
                    <Text style={s.label}>{item.label}</Text>
                    <Combobox.ItemIndicator>
                      <Text style={s.label}>✓</Text>
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </View>
  );
}
