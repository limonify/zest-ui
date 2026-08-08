'use client';

import { Text, View } from 'react-native';
import { Tabs } from '@limonify/zest-ui';
import { c, s } from './styles';

const ITEMS = [
  { value: 'overview', label: 'Overview', body: 'A headless tab set: no styling shipped.' },
  { value: 'activity', label: 'Activity', body: 'Panels mount only while selected.' },
  { value: 'settings', label: 'Settings', body: 'The indicator follows the active tab.' },
];

export function TabsDemo() {
  return (
    <View style={s.stage}>
      <Tabs.Root defaultValue="overview">
        <Tabs.List
          style={{ flexDirection: 'row', gap: 4, borderBottomWidth: 1, borderColor: c.border }}
        >
          {ITEMS.map((item) => (
            <Tabs.Tab
              key={item.value}
              value={item.value}
              style={{ paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Text style={s.label}>{item.label}</Text>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator
            style={(state) => ({
              position: 'absolute',
              bottom: -1,
              height: 2,
              backgroundColor: c.accent,
              left: state.selectedTabPosition?.left ?? 0,
              width: state.selectedTabSize?.width ?? 0,
            })}
          />
        </Tabs.List>

        {ITEMS.map((item) => (
          <Tabs.Panel key={item.value} value={item.value} style={{ paddingTop: 12 }}>
            <Text style={s.muted}>{item.body}</Text>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </View>
  );
}
