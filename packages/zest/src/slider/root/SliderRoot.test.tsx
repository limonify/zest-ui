import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Slider } from '../index';
import type { SliderRootProps } from './SliderRoot';

const CONTROL_SIZE = 200;

function TestSlider<Value extends number | readonly number[] = number>({
  thumbs = 1,
  ...rootProps
}: SliderRootProps<Value> & { thumbs?: number }) {
  return (
    <GestureHandlerRootView>
      <Slider.Root testID="root" {...rootProps}>
        <Slider.Value testID="value" />
        <Slider.Control testID="control">
          <Slider.Track testID="track">
            <Slider.Indicator testID="indicator" />
            {Array.from({ length: thumbs }, (_, index) => (
              <Slider.Thumb key={index} testID={`thumb-${index}`} index={index} />
            ))}
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </GestureHandlerRootView>
  );
}

/**
 * The control turns a touch position into a value by dividing it by its own
 * measured size, so nothing can move until `onLayout` has reported that size.
 */
async function layoutControl(size: number = CONTROL_SIZE) {
  await act(async () => {
    fireEvent(screen.getByTestId('control'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: size, height: size } },
    });
  });
}

/**
 * Presses at the first position, drags through the rest, then lifts.
 *
 * Every position is sent as an explicit ACTIVE event, including the first: any
 * state transition `fireGestureHandler` has to synthesize itself arrives with
 * the coordinates defaulted to 0, which would drag the thumb to the start.
 */
async function drag(...positions: number[]) {
  const last = positions[positions.length - 1]!;

  await act(async () => {
    fireGestureHandler(getByGestureTestId('control'), [
      { state: State.BEGAN, x: positions[0], y: positions[0] },
      ...positions.map((position) => ({ state: State.ACTIVE, x: position, y: position })),
      { state: State.END, x: last, y: last },
    ]);
  });
}

function thumbValue(index: number) {
  return screen.getByTestId(`thumb-${index}`).props.accessibilityValue.now;
}

describe('Slider', () => {
  it('renders every part', async () => {
    await render(<TestSlider defaultValue={30} />);

    expect(screen.getByTestId('root')).toBeTruthy();
    expect(screen.getByTestId('control')).toBeTruthy();
    expect(screen.getByTestId('track')).toBeTruthy();
    expect(screen.getByTestId('thumb-0')).toBeTruthy();
    expect(screen.getByTestId('indicator', { includeHiddenElements: true })).toBeTruthy();
  });

  it('throws when a part is used outside Slider.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Slider.Track />)).rejects.toThrow(/must be placed within <Slider.Root>/);

    error.mockRestore();
  });

  describe('value', () => {
    it('updates an uncontrolled value on drag', async () => {
      await render(<TestSlider defaultValue={0} />);
      await layoutControl();

      await drag(CONTROL_SIZE / 2);

      expect(thumbValue(0)).toBe(50);
    });

    it('does not move an uncontrolled value before the control has been measured', async () => {
      await render(<TestSlider defaultValue={40} />);

      await drag(CONTROL_SIZE / 2);

      expect(thumbValue(0)).toBe(40);
    });

    it('holds a controlled value that the consumer does not change', async () => {
      const onValueChange = jest.fn();
      await render(<TestSlider value={20} onValueChange={onValueChange} />);
      await layoutControl();

      await drag(CONTROL_SIZE / 2);

      expect(onValueChange).toHaveBeenCalledWith(50, expect.objectContaining({ reason: 'drag' }));
      expect(thumbValue(0)).toBe(20);
    });

    it('follows a controlled value the consumer commits', async () => {
      function ControlledSlider() {
        const [value, setValue] = React.useState(20);
        return <TestSlider value={value} onValueChange={setValue} />;
      }

      await render(<ControlledSlider />);
      await layoutControl();

      await drag(CONTROL_SIZE / 4);

      expect(thumbValue(0)).toBe(25);
    });

    it('lets onValueChange cancel the change', async () => {
      const onValueChange = jest.fn((_value, eventDetails) => eventDetails.cancel());
      await render(<TestSlider defaultValue={20} onValueChange={onValueChange} />);
      await layoutControl();

      await drag(CONTROL_SIZE / 2);

      expect(onValueChange).toHaveBeenCalled();
      expect(thumbValue(0)).toBe(20);
    });

    it('moves the thumb with the finger across a drag', async () => {
      const onValueChange = jest.fn();
      await render(<TestSlider defaultValue={0} onValueChange={onValueChange} />);
      await layoutControl();

      await drag(0, CONTROL_SIZE / 4, CONTROL_SIZE / 2);

      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([25, 50]);
      expect(thumbValue(0)).toBe(50);
    });
  });

  describe('min, max and step', () => {
    it('maps a position onto a custom min/max range', async () => {
      await render(<TestSlider defaultValue={0} min={-50} max={50} />);
      await layoutControl();

      await drag(CONTROL_SIZE / 4);

      expect(thumbValue(0)).toBe(-25);
    });

    it('rounds to the nearest step', async () => {
      await render(<TestSlider defaultValue={0} step={25} />);
      await layoutControl();

      await drag(CONTROL_SIZE * 0.6);

      expect(thumbValue(0)).toBe(50);
    });

    it('rounds a fractional step to the step precision', async () => {
      await render(<TestSlider defaultValue={0} min={0} max={1} step={0.1} />);
      await layoutControl();

      await drag(CONTROL_SIZE * 0.3);

      // 0.30000000000000004 without the precision correction.
      expect(thumbValue(0)).toBe(0.3);
    });

    it('clamps a position beyond the control to the range', async () => {
      await render(<TestSlider defaultValue={0} />);
      await layoutControl();

      await drag(CONTROL_SIZE * 2);

      expect(thumbValue(0)).toBe(100);
    });
  });

  describe('range', () => {
    it('reports an array value when the consumer passes one', async () => {
      const onValueChange = jest.fn();
      await render(<TestSlider thumbs={2} defaultValue={[20, 80]} onValueChange={onValueChange} />);
      await layoutControl();

      await drag(CONTROL_SIZE * 0.3);

      expect(onValueChange).toHaveBeenCalledWith([30, 80], expect.anything());
      expect(thumbValue(0)).toBe(30);
      expect(thumbValue(1)).toBe(80);
    });

    it('drags the thumb closest to the press', async () => {
      await render(<TestSlider thumbs={2} defaultValue={[20, 80]} />);
      await layoutControl();

      await drag(CONTROL_SIZE * 0.9);

      expect(thumbValue(0)).toBe(20);
      expect(thumbValue(1)).toBe(90);
    });

    it('stops a thumb at its neighbour', async () => {
      await render(<TestSlider thumbs={2} defaultValue={[20, 50]} />);
      await layoutControl();

      // Press nearest the lower thumb, then drag it past the upper one.
      await drag(CONTROL_SIZE * 0.2, CONTROL_SIZE * 0.9);

      expect(thumbValue(0)).toBe(50);
      expect(thumbValue(1)).toBe(50);
    });

    it('keeps minStepsBetweenValues between thumbs', async () => {
      await render(<TestSlider thumbs={2} defaultValue={[20, 50]} minStepsBetweenValues={10} />);
      await layoutControl();

      await drag(CONTROL_SIZE * 0.2, CONTROL_SIZE * 0.9);

      expect(thumbValue(0)).toBe(40);
    });
  });

  describe('orientation', () => {
    it('measures height and inverts the axis when vertical', async () => {
      await render(<TestSlider defaultValue={0} orientation="vertical" />);
      await layoutControl();

      // A vertical slider grows upwards, so a press a quarter down the control
      // is three quarters of the way up the range.
      await drag(CONTROL_SIZE / 4);

      expect(thumbValue(0)).toBe(75);
    });
  });

  describe('disabled', () => {
    it('ignores a drag', async () => {
      const onValueChange = jest.fn();
      await render(<TestSlider defaultValue={20} disabled onValueChange={onValueChange} />);
      await layoutControl();

      await drag(CONTROL_SIZE / 2);

      expect(onValueChange).not.toHaveBeenCalled();
      expect(thumbValue(0)).toBe(20);
    });

    it('marks the thumb as disabled', async () => {
      await render(<TestSlider defaultValue={20} disabled />);

      expect(screen.getByTestId('thumb-0').props.accessibilityState).toMatchObject({
        disabled: true,
      });
    });
  });

  describe('onValueCommitted', () => {
    it('fires once the drag ends, with the settled value', async () => {
      const onValueCommitted = jest.fn();
      await render(<TestSlider defaultValue={0} onValueCommitted={onValueCommitted} />);
      await layoutControl();

      await drag(CONTROL_SIZE / 4, CONTROL_SIZE / 2);

      expect(onValueCommitted).toHaveBeenCalledTimes(1);
      expect(onValueCommitted).toHaveBeenCalledWith(50, expect.objectContaining({ reason: 'drag' }));
    });
  });

  describe('accessibility', () => {
    it('exposes the range and value on the thumb', async () => {
      await render(<TestSlider defaultValue={30} min={10} max={90} />);

      const thumb = screen.getByTestId('thumb-0');
      expect(thumb.props.accessibilityRole).toBe('adjustable');
      expect(thumb.props.accessibilityValue).toMatchObject({ min: 10, max: 90, now: 30 });
    });

    it('formats the accessibility value text when a format is given', async () => {
      await render(
        <TestSlider defaultValue={30} format={{ style: 'percent' }} locale="en-US" />,
      );

      expect(screen.getByTestId('thumb-0').props.accessibilityValue.text).toBe('3,000%');
    });
  });

  describe('Slider.Value', () => {
    it('renders the value', async () => {
      await render(<TestSlider defaultValue={30} />);

      expect(screen.getByTestId('value')).toHaveTextContent('30');
    });

    it('joins a range', async () => {
      await render(<TestSlider thumbs={2} defaultValue={[20, 80]} />);

      expect(screen.getByTestId('value')).toHaveTextContent('20 – 80');
    });

    it('formats with the given options and locale', async () => {
      await render(
        <TestSlider defaultValue={0.3} min={0} max={1} step={0.1} format={{ style: 'percent' }} locale="en-US" />,
      );

      expect(screen.getByTestId('value')).toHaveTextContent('30%');
    });

    it('accepts a children function', async () => {
      await render(
        <GestureHandlerRootView>
          <Slider.Root defaultValue={30}>
            <Slider.Value testID="value">
              {(formatted, values) => `${formatted[0]} of ${values.length}`}
            </Slider.Value>
          </Slider.Root>
        </GestureHandlerRootView>,
      );

      expect(screen.getByTestId('value')).toHaveTextContent('30 of 1');
    });
  });

  describe('state', () => {
    // The `dragging: true` phase has no test here on purpose: `fireGestureHandler`
    // always ends the gesture it fires, and React batches every handler it
    // triggers into a single render, so the in-flight state never commits and
    // cannot be observed. Only its resting value is assertable.
    it('publishes the root state to a style function', async () => {
      await render(
        <GestureHandlerRootView>
          <Slider.Root defaultValue={40} min={10} max={90}>
            <Slider.Control
              testID="control"
              style={(state) => ({ opacity: state.dragging ? 0.5 : 1 })}
            />
          </Slider.Root>
        </GestureHandlerRootView>,
      );

      expect(screen.getByTestId('control')).toHaveStyle({ opacity: 1 });
    });
  });
});
