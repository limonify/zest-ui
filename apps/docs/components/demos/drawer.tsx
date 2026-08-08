'use client';

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Drawer } from '@limonify/zest-ui';
import { c, s } from './styles';

export function DrawerDemo() {
  const [reason, setReason] = useState<string | null>(null);

  return (
    <View style={s.stage}>
      <Drawer.Root
        swipeDirection="down"
        onOpenChange={(open, details) => {
          if (!open) {
            setReason(details.reason);
          }
        }}
      >
        <Drawer.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Open drawer</Text>
        </Drawer.Trigger>

        <Drawer.Portal>
          <Drawer.Backdrop style={[StyleSheet.absoluteFill, s.backdrop]} />
          <Drawer.Viewport
            style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
            pointerEvents="box-none"
          >
            {/* The popup never moves itself: it publishes `swipeMovement` and
                this transform is the consumer's. */}
            <Drawer.Popup
              style={(state) => [
                s.popup,
                {
                  maxWidth: undefined,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  paddingBottom: 28,
                  transform: [{ translateY: state.swipeMovement }],
                },
              ]}
            >
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c.border,
                }}
              />
              <Drawer.Title style={s.heading}>Swipe me down</Drawer.Title>
              <Drawer.Description style={s.muted}>
                Drag this sheet down past 40pt to dismiss it, or press the backdrop.
              </Drawer.Description>
              <Drawer.Close style={(state) => [s.button, state.pressed && s.buttonPressed]}>
                <Text style={s.buttonText}>Close</Text>
              </Drawer.Close>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <Text style={s.muted}>Last close reason: {reason ?? '—'}</Text>
    </View>
  );
}
