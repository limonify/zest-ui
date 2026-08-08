'use client';

import { Text, View } from 'react-native';
import { Avatar } from '@limonify/zest-ui';
import { c, s } from './styles';

const root = { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' as const, backgroundColor: c.border };
const image = { width: 48, height: 48 };
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
          <Avatar.Image source={{ uri: 'https://i.pravatar.cc/96?img=12' }} style={image} />
          <Avatar.Fallback style={fallback}>
            <Text style={s.label}>EB</Text>
          </Avatar.Fallback>
        </Avatar.Root>

        <Avatar.Root style={root}>
          <Avatar.Image source={{ uri: '/this-image-does-not-exist.png' }} style={image} />
          <Avatar.Fallback style={fallback}>
            <Text style={s.label}>404</Text>
          </Avatar.Fallback>
        </Avatar.Root>
      </View>
      <Text style={s.muted}>The second image 404s, so its fallback stays visible.</Text>
    </View>
  );
}
