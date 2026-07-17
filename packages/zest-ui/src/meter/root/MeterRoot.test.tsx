import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Meter } from '../../index';

function TestMeter(props: React.ComponentProps<typeof Meter.Root>) {
  return (
    <Meter.Root testID="root" {...props}>
      <Meter.Label testID="label">Storage</Meter.Label>
      <Meter.Track testID="track">
        <Meter.Indicator testID="indicator" />
      </Meter.Track>
      <Meter.Value testID="value" />
    </Meter.Root>
  );
}

const hidden = { includeHiddenElements: true } as const;

describe('Meter', () => {
  it('reports the value to assistive technology', async () => {
    await render(<TestMeter value={40} />);

    expect(screen.getByTestId('root').props.role).toBe('meter');
    expect(screen.getByTestId('root').props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 40,
    });
  });

  it('sizes the indicator to the value position', async () => {
    await render(<TestMeter value={30} />);
    expect(screen.getByTestId('indicator').props.style).toMatchObject({ width: '30%' });
  });

  it('normalizes the percentage for a custom min/max', async () => {
    await render(<TestMeter value={15} min={10} max={20} />);
    // (15 - 10) / (20 - 10) = 50%
    expect(screen.getByTestId('indicator').props.style).toMatchObject({ width: '50%' });
  });

  it('clamps out-of-range values', async () => {
    await render(<TestMeter value={150} />);
    expect(screen.getByTestId('indicator').props.style).toMatchObject({ width: '100%' });
    expect(screen.getByTestId('root').props.accessibilityValue).toMatchObject({ now: 100 });
  });

  it('associates the label and shows the formatted value', async () => {
    await render(<TestMeter value={40} />);

    const labelId = screen.getByTestId('label').props.nativeID;
    expect(screen.getByTestId('root').props.accessibilityLabelledBy).toBe(labelId);
    // Default format is a percentage of the range.
    expect(screen.getByTestId('value', hidden)).toHaveTextContent('40%');
  });

  it('throws when a part is used outside the root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Meter.Indicator />)).rejects.toThrow(/MeterRootContext is missing/);
    error.mockRestore();
  });
});
