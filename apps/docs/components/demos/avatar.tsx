'use client';

import { Text, View } from 'react-native';
import { Avatar } from '@limonify/zest-ui';
import { c, s } from './styles';

const root = { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' as const, backgroundColor: c.border };
const image = { width: 48, height: 48 };

// Hoisted, and it matters: an inline `{{ uri }}` is a new object on every
// render, and react-native-web's `Image` reloads whenever the source's identity
// changes — the reload sets loading status, which renders, which makes another
// object. That loops until React gives up with "Maximum update depth exceeded".
// The first source is a data URI, so the demo needs no network to render it.
const PHOTO = {
  uri: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2296%22 height=%2296%22%3E%3Crect width=%2296%22 height=%2296%22 fill=%22%234c7a0b%22/%3E%3Ctext x=%2248%22 y=%2260%22 font-family=%22sans-serif%22 font-size=%2236%22 font-weight=%22700%22 text-anchor=%22middle%22 fill=%22%23fbfaf5%22%3EEB%3C/text%3E%3C/svg%3E',
};
const MISSING = { uri: '/this-image-does-not-exist.png' };
// The fallback has to overlay the image rather than follow it in flow, or the
// root's `overflow: 'hidden'` clips it away.
const fallback = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export function AvatarDemo() {
  return (
    <View style={s.stage}>
      <View style={s.row}>
        <Avatar.Root style={root}>
          <Avatar.Image source={PHOTO} style={image} />
          <Avatar.Fallback style={fallback}>
            <Text style={s.label}>EB</Text>
          </Avatar.Fallback>
        </Avatar.Root>

        <Avatar.Root style={root}>
          <Avatar.Image source={MISSING} style={image} />
          <Avatar.Fallback style={fallback}>
            <Text style={s.label}>404</Text>
          </Avatar.Fallback>
        </Avatar.Root>
      </View>
      <Text style={s.muted}>The second image 404s, so its fallback stays visible.</Text>
    </View>
  );
}
