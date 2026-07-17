import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Select } from '../index';

function TestSelect({ withLabel = true }: { withLabel?: boolean }) {
  return (
    <Select.Root>
      {withLabel ? <Select.Label testID="label">Fruit</Select.Label> : null}
      <Select.Trigger testID="trigger">
        <Select.Value testID="value" />
      </Select.Trigger>
    </Select.Root>
  );
}

describe('Select.Label', () => {
  it('renders its text', async () => {
    await render(<TestSelect />);
    expect(screen.getByTestId('label')).toHaveTextContent('Fruit');
  });

  it('associates the label with the trigger', async () => {
    await render(<TestSelect />);

    const labelId = screen.getByTestId('label').props.nativeID;
    expect(labelId).toBeTruthy();
    expect(screen.getByTestId('trigger').props.accessibilityLabelledBy).toBe(labelId);
  });

  it('leaves the trigger unlabelled when there is no label', async () => {
    await render(<TestSelect withLabel={false} />);
    expect(screen.getByTestId('trigger').props.accessibilityLabelledBy).toBeUndefined();
  });

  it('clears the association when the label unmounts', async () => {
    const view = await render(<TestSelect />);
    expect(screen.getByTestId('trigger').props.accessibilityLabelledBy).toBeTruthy();

    await view.rerender(<TestSelect withLabel={false} />);
    expect(screen.getByTestId('trigger').props.accessibilityLabelledBy).toBeUndefined();
  });
});
