'use client';

import { StyleSheet, Text, View } from 'react-native';
import { AlertDialog } from '@limonify/zest-ui';
import { c, s } from './styles';

export function AlertDialogDemo() {
  return (
    <View style={s.stage}>
      <AlertDialog.Root>
        <AlertDialog.Trigger style={(state) => [s.button, { backgroundColor: c.danger }, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Delete account</Text>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop style={[StyleSheet.absoluteFill, s.backdrop]} />
          <View style={[StyleSheet.absoluteFill, s.centered]} pointerEvents="box-none">
            <AlertDialog.Popup style={s.popup}>
              <AlertDialog.Title style={s.heading}>Are you sure?</AlertDialog.Title>
              <AlertDialog.Description style={s.muted}>
                Unlike a Dialog, pressing the backdrop does not dismiss this — a destructive choice
                has to be made deliberately.
              </AlertDialog.Description>
              <View style={[s.row, { justifyContent: 'flex-end' }]}>
                <AlertDialog.Close style={(state) => [s.button, state.pressed && s.buttonPressed]}>
                  <Text style={s.buttonText}>Cancel</Text>
                </AlertDialog.Close>
              </View>
            </AlertDialog.Popup>
          </View>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </View>
  );
}
