import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Separator } from './Separator';

describe('Separator', () => {
  it('renders with the separator role and default orientation', async () => {
    await render(<Separator testID="sep" />);

    const separator = screen.getByTestId('sep');
    expect(separator.props.role).toBe('separator');
    expect(separator.props['aria-orientation']).toBe('horizontal');
  });

  it('exposes orientation to style functions', async () => {
    await render(
      <Separator
        testID="sep"
        orientation="vertical"
        style={(state) => ({ width: state.orientation === 'vertical' ? 1 : undefined })}
      />,
    );

    const separator = screen.getByTestId('sep');
    expect(separator.props['aria-orientation']).toBe('vertical');
  });
});
