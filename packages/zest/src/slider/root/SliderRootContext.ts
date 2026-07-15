'use client';
import * as React from 'react';
import type { Orientation } from '../../types';
import type { SliderRoot, SliderRootState } from './SliderRoot';

export interface SliderRootContext {
  values: readonly number[];
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  orientation: Orientation;
  dragging: boolean;
  state: SliderRootState;
  format: Intl.NumberFormatOptions | undefined;
  locale: Intl.LocalesArgument | undefined;
  /**
   * The measured size of the control along its main axis, which is what turns a
   * touch position into a value.
   */
  controlSize: number | undefined;
  setControlSize: (size: number) => void;
  setDragging: (dragging: boolean) => void;
  /**
   * Commits a value for one thumb, clamped to the range and to its neighbours.
   */
  setThumbValue: (
    index: number,
    value: number,
    eventDetails: SliderRoot.ChangeEventDetails,
  ) => void;
  /**
   * Converts a position along the control into a value, or `undefined` while the
   * control has not been measured yet.
   */
  getValueFromPosition: (position: number) => number | undefined;
  /**
   * The index of the thumb closest to a value, used to pick which thumb a drag
   * should move.
   */
  getClosestThumbIndex: (value: number) => number;
  commitValue: (eventDetails: SliderRoot.ChangeEventDetails) => void;
}

export const SliderRootContext = React.createContext<SliderRootContext | undefined>(undefined);

export function useSliderRootContext() {
  const context = React.useContext(SliderRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.',
    );
  }

  return context;
}
