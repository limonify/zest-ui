'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Slider } from '@limonify/zest-ui';
import { s } from './styles';

export function SliderDemo() {
  const [value, setValue] = useState(40);
  const [range, setRange] = useState<readonly number[]>([25, 75]);

  return (
    <View style={s.stage}>
      <Text style={s.label}>Single — {value}</Text>
      <Slider.Root value={value} onValueChange={setValue}>
        <Slider.Control style={s.sliderControl}>
          <Slider.Track style={s.track}>
            <Slider.Indicator style={s.indicator} />
            <Slider.Thumb index={0} style={s.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Text style={s.label}>Range — {range[0]} to {range[1]}</Text>
      <Slider.Root value={range} onValueChange={setRange} minStepsBetweenValues={5}>
        <Slider.Control style={s.sliderControl}>
          <Slider.Track style={s.track}>
            <Slider.Indicator style={s.indicator} />
            <Slider.Thumb index={0} style={s.thumb} />
            <Slider.Thumb index={1} style={s.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Text style={s.muted}>Drag one thumb into the other: it pushes, keeping 5 apart.</Text>
    </View>
  );
}
