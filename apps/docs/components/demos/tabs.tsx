'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Tabs } from '@limonify/zest-ui';
import { c, s } from './styles';

const ITEMS = [
  { value: 'overview', label: 'Overview', body: 'A headless tab set: no styling shipped.' },
  { value: 'activity', label: 'Activity', body: 'Panels mount only while selected.' },
  { value: 'settings', label: 'Settings', body: 'The indicator follows the active tab.' },
];

const list = { flexDirection: 'row' as const, gap: 4, borderBottomWidth: 1, borderColor: c.border };
const tab = { paddingHorizontal: 12, paddingVertical: 10 };
const indicatorStyle = (state: {
  selectedTabPosition?: { left: number } | null | undefined;
  selectedTabSize?: { width: number } | null | undefined;
}) => ({
  position: 'absolute' as const,
  bottom: -1,
  height: 2,
  backgroundColor: c.accent,
  left: state.selectedTabPosition?.left ?? 0,
  width: state.selectedTabSize?.width ?? 0,
});

export function TabsDemo() {
  return (
    <View style={s.stage}>
      <Tabs.Root defaultValue="overview">
        <Tabs.List style={list}>
          {ITEMS.map((item) => (
            <Tabs.Tab key={item.value} value={item.value} style={tab}>
              <Text style={s.label}>{item.label}</Text>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator style={indicatorStyle} />
        </Tabs.List>

        {ITEMS.map((item) => (
          <Tabs.Panel key={item.value} value={item.value} style={{ paddingTop: 12 }}>
            <Text style={s.muted}>{item.body}</Text>
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      <ControlledTabs />
    </View>
  );
}

function ControlledTabs() {
  const [value, setValue] = useState('tab-a');

  return (
    <Tabs.Root value={value} onValueChange={setValue}>
      <Tabs.List style={list}>
        <Tabs.Tab value="tab-a" style={tab}>
          <Text style={s.label}>A</Text>
        </Tabs.Tab>
        <Tabs.Tab
          value="tab-b"
          disabled
          style={(state) => [tab, state.disabled && s.buttonDisabled]}
        >
          <Text style={s.label}>B — disabled</Text>
        </Tabs.Tab>
        <Tabs.Tab value="tab-c" style={tab}>
          <Text style={s.label}>C</Text>
        </Tabs.Tab>
        <Tabs.Indicator style={indicatorStyle} />
      </Tabs.List>
      <Tabs.Panel value="tab-a" style={{ paddingTop: 12 }}>
        <Text style={s.muted}>Controlled — value {value} is owned by the page.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="tab-b" style={{ paddingTop: 12 }}>
        <Text style={s.muted}>A disabled tab stays put and cannot be focused.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="tab-c" style={{ paddingTop: 12 }}>
        <Text style={s.muted}>The indicator follows whatever becomes active.</Text>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
