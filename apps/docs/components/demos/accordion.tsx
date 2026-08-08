'use client';

import { Pressable, Text, View } from 'react-native';
import { Accordion } from '@limonify/zest-ui';
import { s } from './styles';

const ITEMS = [
  { value: 'shipping', title: 'Shipping', body: 'Ships in 2–4 business days.' },
  { value: 'returns', title: 'Returns', body: 'Free returns within 30 days of delivery.' },
  { value: 'support', title: 'Support', body: 'Weekdays, 9:00 to 18:00.' },
];

export function AccordionDemo() {
  return (
    <View style={s.stage}>
      <Accordion.Root defaultValue={['shipping']}>
        {ITEMS.map((item) => (
          <Accordion.Item key={item.value} value={item.value}>
            <Accordion.Header>
              <Accordion.Trigger
                render={(props, state) => (
                  <Pressable {...props} style={s.item}>
                    <Text style={s.heading}>{item.title}</Text>
                    <Text style={s.muted}>{state.open ? '⌃' : '⌄'}</Text>
                  </Pressable>
                )}
              />
            </Accordion.Header>
            <Accordion.Panel>
              <Text style={[s.muted, { paddingHorizontal: 10, paddingBottom: 10 }]}>
                {item.body}
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </View>
  );
}
