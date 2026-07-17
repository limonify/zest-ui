import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Progress } from '../index';

function TestProgress(props: React.ComponentProps<typeof Progress.Root>) {
  return (
    <Progress.Root testID="root" {...props}>
      <Progress.Label testID="label">Uploading</Progress.Label>
      <Progress.Value testID="value" />
      <Progress.Track testID="track">
        <Progress.Indicator testID="indicator" />
      </Progress.Track>
    </Progress.Root>
  );
}

const hidden = { includeHiddenElements: true } as const;

describe('Progress', () => {
  it('renders every part', async () => {
    await render(<TestProgress value={30} />);

    expect(screen.getByTestId('root')).toBeTruthy();
    expect(screen.getByTestId('label')).toBeTruthy();
    expect(screen.getByTestId('track')).toBeTruthy();
    expect(screen.getByTestId('indicator')).toBeTruthy();
    expect(screen.getByTestId('value', hidden)).toBeTruthy();
  });

  it('throws when a part is used outside Progress.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Progress.Track />)).rejects.toThrow(/must be placed within <Progress.Root>/);

    error.mockRestore();
  });

  describe('status', () => {
    it.each([
      ['progressing', 30],
      ['complete', 100],
      ['indeterminate', null],
    ])('is %s', async (status, value) => {
      const seen: string[] = [];
      await render(
        <Progress.Root
          testID="root"
          value={value as number | null}
          style={(state) => {
            seen.push(state.status);
            return {};
          }}
        />,
      );

      expect(seen).toEqual([status]);
    });

    it('is complete at a custom max', async () => {
      const seen: string[] = [];
      await render(
        <Progress.Root
          value={50}
          max={50}
          style={(state) => {
            seen.push(state.status);
            return {};
          }}
        />,
      );

      expect(seen).toEqual(['complete']);
    });

    it('is indeterminate for a non-finite value', async () => {
      const seen: string[] = [];
      await render(
        <Progress.Root
          value={Number.NaN}
          style={(state) => {
            seen.push(state.status);
            return {};
          }}
        />,
      );

      expect(seen).toEqual(['indeterminate']);
    });
  });

  describe('indicator', () => {
    it('is sized to the value as a percentage', async () => {
      await render(<TestProgress value={30} />);

      expect(screen.getByTestId('indicator')).toHaveStyle({ width: '30%' });
    });

    it('maps the value onto a custom min/max range', async () => {
      await render(<TestProgress value={5} min={0} max={20} />);

      expect(screen.getByTestId('indicator')).toHaveStyle({ width: '25%' });
    });

    it('clamps a value beyond the range', async () => {
      await render(<TestProgress value={500} />);

      expect(screen.getByTestId('indicator')).toHaveStyle({ width: '100%' });
    });

    it('has no width while indeterminate', async () => {
      await render(<TestProgress value={null} />);

      // Nothing to show, so the indicator is left entirely to the consumer.
      expect(screen.getByTestId('indicator')).not.toHaveStyle({ width: '0%' });
      expect(screen.getByTestId('indicator').props.style).toBeUndefined();
    });
  });

  describe('Progress.Value', () => {
    it('renders the value as a percentage of the range by default', async () => {
      await render(<TestProgress value={30} />);

      expect(screen.getByTestId('value', hidden)).toHaveTextContent('30%');
    });

    it('formats with the given options and locale', async () => {
      await render(<TestProgress value={30} format={{ style: 'currency', currency: 'USD' }} locale="en-US" />);

      expect(screen.getByTestId('value', hidden)).toHaveTextContent('$30.00');
    });

    it('renders nothing while indeterminate', async () => {
      await render(<TestProgress value={null} />);

      expect(screen.getByTestId('value', hidden)).toHaveTextContent('');
    });

    it('accepts a children function', async () => {
      await render(
        <Progress.Root value={null}>
          <Progress.Value testID="value">
            {(formatted, value) => `${formatted} (${value})`}
          </Progress.Value>
        </Progress.Root>,
      );

      expect(screen.getByTestId('value', hidden)).toHaveTextContent('indeterminate (null)');
    });
  });

  describe('accessibility', () => {
    it('exposes the range, value and formatted text', async () => {
      await render(<TestProgress value={5} min={0} max={20} />);

      const root = screen.getByTestId('root');
      expect(root.props.accessibilityRole).toBe('progressbar');
      expect(root.props.accessibilityValue).toMatchObject({ min: 0, max: 20, now: 5, text: '25%' });
    });

    it('announces indeterminate progress', async () => {
      await render(<TestProgress value={null} />);

      expect(screen.getByTestId('root').props.accessibilityValue).toMatchObject({
        text: 'indeterminate progress',
      });
      expect(screen.getByTestId('root').props.accessibilityValue.now).toBeUndefined();
    });

    it('honours getAccessibilityValueText', async () => {
      await render(<TestProgress value={30} getAccessibilityValueText={(formatted) => `${formatted} done`} />);

      expect(screen.getByTestId('root').props.accessibilityValue.text).toBe('30% done');
    });

    it('labels the root with the label', async () => {
      await render(<TestProgress value={30} />);

      const labelId = screen.getByTestId('label').props.nativeID;
      expect(labelId).toBeTruthy();
      expect(screen.getByTestId('root').props.accessibilityLabelledBy).toBe(labelId);
    });

    it('drops the label reference when the label unmounts', async () => {
      const view = await render(<TestProgress value={30} />);

      await view.rerender(
        <Progress.Root testID="root" value={30}>
          <Progress.Track testID="track" />
        </Progress.Root>,
      );

      expect(screen.getByTestId('root').props.accessibilityLabelledBy).toBeUndefined();
    });
  });
});
