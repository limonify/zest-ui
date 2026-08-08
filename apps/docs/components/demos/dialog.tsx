'use client';

import { StyleSheet, Text, View } from 'react-native';
import { Dialog } from '@limonify/zest-ui';
import { s } from './styles';

export function DialogDemo() {
  return (
    <View style={s.stage}>
      <Dialog.Root>
        <Dialog.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Open dialog</Text>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop style={[StyleSheet.absoluteFill, s.backdrop]} />
          <View style={[StyleSheet.absoluteFill, s.centered]} pointerEvents="box-none">
            <Dialog.Popup style={s.popup}>
              <Dialog.Title style={s.heading}>Delete project</Dialog.Title>
              <Dialog.Description style={s.muted}>
                This cannot be undone. Everything in it goes with it.
              </Dialog.Description>
              <View style={[s.row, { justifyContent: 'flex-end' }]}>
                <Dialog.Close style={(state) => [s.button, state.pressed && s.buttonPressed]}>
                  <Text style={s.buttonText}>Close</Text>
                </Dialog.Close>
              </View>
            </Dialog.Popup>
          </View>
        </Dialog.Portal>
      </Dialog.Root>
    </View>
  );
}
