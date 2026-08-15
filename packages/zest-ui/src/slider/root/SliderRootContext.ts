'use client';
import * as React from 'react';
import type { SliderStore } from '../store/SliderStore';

export const SliderRootContext = React.createContext<SliderStore | undefined>(undefined);

export function useSliderRootContext() {
  const context = React.useContext(SliderRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.',
    );
  }

  return context;
}
