'use client';

import { Text, View } from 'react-native';
import { Tooltip } from '@limonify/zest-ui';
import { c, s } from './styles';

export function TooltipDemo() {
  return (
    <View style={s.stage}>
      <Tooltip.Root>
        <Tooltip.Trigger style={(state) => [s.button, state.pressed && s.buttonPressed]}>
          <Text style={s.buttonText}>Press me</Text>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Positioner side="top" sideOffset={8}>
            {/* A tooltip inverts the theme: the foreground colour becomes the
                surface and the surface becomes the text. */}
            <Tooltip.Popup
              style={{
                backgroundColor: c.fg,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: c.card, fontSize: 13 }}>Opened by press, not hover</Text>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Text style={s.muted}>
        A touch screen has no hover, so a tooltip opens on press and closes on an outside press.
      </Text>
    </View>
  );
}
