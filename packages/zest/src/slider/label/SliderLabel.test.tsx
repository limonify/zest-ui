import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slider } from '../index';

function TestSlider({ withLabel = true }: { withLabel?: boolean }) {
  return (
    <GestureHandlerRootView>
      <Slider.Root testID="root" defaultValue={30}>
        {withLabel ? <Slider.Label testID="label">Volume</Slider.Label> : null}
        <Slider.Control testID="control">
          <Slider.Track testID="track">
            <Slider.Indicator testID="indicator" />
            <Slider.Thumb testID="thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </GestureHandlerRootView>
  );
}

describe('Slider.Label', () => {
  it('renders its text', async () => {
    await render(<TestSlider />);
    expect(screen.getByTestId('label')).toHaveTextContent('Volume');
  });

  it('associates the label with the thumb', async () => {
    await render(<TestSlider />);

    const labelId = screen.getByTestId('label').props.nativeID;
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId('thumb').props.accessibilityLabelledBy).toBe(labelId);
  });

  it('leaves the thumb unlabelled when there is no label', async () => {
    await render(<TestSlider withLabel={false} />);
    expect(screen.getByTestId('thumb').props.accessibilityLabelledBy).toBeUndefined();
  });

  it('exposes the slider state to a style function', async () => {
    await render(
      <GestureHandlerRootView>
        <Slider.Root testID="root" defaultValue={30} disabled>
          <Slider.Label testID="label" style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}>
            Volume
          </Slider.Label>
        </Slider.Root>
      </GestureHandlerRootView>,
    );

    expect(screen.getByTestId('label').props.style).toMatchObject({ opacity: 0.5 });
  });
});
