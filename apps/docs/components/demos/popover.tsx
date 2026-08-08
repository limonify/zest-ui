'use client';

import { StyleSheet, Text, View } from 'react-native';
import { Popover } from '@limonify/zest-ui';
import { c, s } from './styles';

export function PopoverDemo() {
  return (
    <View style={s.stage}>
      <Popover.Root>
        <Popover.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Show popover</Text>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Backdrop style={StyleSheet.absoluteFill} />
          <Popover.Positioner side="bottom" align="center" sideOffset={10}>
            <Popover.Arrow
              style={{
                width: 12,
                height: 12,
                backgroundColor: c.card,
                borderColor: c.border,
                borderWidth: 1,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <Popover.Popup style={s.popup}>
              <Popover.Title style={s.heading}>Popover title</Popover.Title>
              <Popover.Description style={s.muted}>
                The Positioner does the placement; the Popup is a View you style. It flips sides
                when it would run off the edge.
              </Popover.Description>
              <Popover.Close style={(state) => [s.button, state.pressed && s.buttonPressed]}>
                <Text style={s.buttonText}>Close</Text>
              </Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </View>
  );
}
