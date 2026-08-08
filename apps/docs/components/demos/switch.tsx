'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Switch } from '@limonify/zest-ui';
import { c, s } from './styles';

const track = { width: 46, height: 28, borderRadius: 14, padding: 3, backgroundColor: c.border };
const trackOn = { backgroundColor: c.accent };
const thumb = { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' };
const thumbOn = { transform: [{ translateX: 18 }] };

export function SwitchDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <View style={s.stage}>
      <View style={s.row}>
        <Switch.Root
          checked={checked}
          onCheckedChange={setChecked}
          style={(state) => [track, state.checked && trackOn]}
        >
          {/* `keepMounted` or the thumb disappears when the switch is off: it
              unmounts on uncheck so an exit animation is opt-in. */}
          <Switch.Thumb keepMounted style={(state) => [thumb, state.checked && thumbOn]} />
        </Switch.Root>
        <Text style={s.label}>{checked ? 'On' : 'Off'}</Text>
      </View>

      <View style={s.row}>
        <Switch.Root
          disabled
          defaultChecked
          style={(state) => [track, state.checked && trackOn, state.disabled && s.buttonDisabled]}
        >
          <Switch.Thumb style={(state) => [thumb, state.checked && thumbOn]} />
        </Switch.Root>
        <Text style={s.muted}>Disabled</Text>
      </View>
    </View>
  );
}
