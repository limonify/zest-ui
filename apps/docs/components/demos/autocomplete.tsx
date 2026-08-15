'use client';

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Autocomplete } from '@limonify/zest-ui';
import { FollowScroll } from './follow-scroll';
import { s } from './styles';

const TAGS = ['design', 'docs', 'engineering', 'marketing', 'research', 'support'];

export function AutocompleteDemo() {
  const [text, setText] = useState('');

  return (
    <View style={s.stage}>
      <Autocomplete.Root
        items={TAGS}
        inputValue={text}
        onInputValueChange={setText}
      >
        <Autocomplete.Input placeholder="Add a tag" style={s.control} />
        <Autocomplete.Portal>
          <FollowScroll>
            <Autocomplete.Positioner
              style={(state) => (state.triggerWidth ? { width: state.triggerWidth } : undefined)}
            >
              <Autocomplete.Popup style={[s.popup, { maxHeight: 200 }]}>
                <Autocomplete.List render={(props) => <ScrollView {...props} />}>
                  {(item) => (
                    <Autocomplete.Item
                      key={String(item.value)}
                      item={item}
                      style={(state) => [s.item, state.pressed && s.itemPressed]}
                    >
                      <Text style={s.label}>{item.label}</Text>
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </FollowScroll>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      <Text style={s.muted}>
        The typed text is the value — a suggestion fills the input rather than binding an item.
      </Text>
    </View>
  );
}
