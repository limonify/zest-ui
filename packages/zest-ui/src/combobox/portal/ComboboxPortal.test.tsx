import * as React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Autocomplete, Combobox } from '../../index';

const FRUITS = ['Apple', 'Banana', 'Cherry'];

function TestPortal(props: Partial<React.ComponentProps<typeof Combobox.Portal>>) {
  return (
    <Combobox.Root items={FRUITS} defaultOpen>
      <Combobox.Portal {...props}>
        <Combobox.Positioner>
          <Combobox.Popup testID="popup">
            <Combobox.List>
              {(item) => (
                <Combobox.Item key={String(item.value)} item={item}>
                  <Text>{item.label}</Text>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** Whether the tree holds the non-Modal overlay — a full-screen, touch-transparent view. */
function hasBoxNoneOverlay(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return false;
  }
  const element = node as { props?: Record<string, unknown>; children?: unknown[] };
  if (element.props?.pointerEvents === 'box-none') {
    return true;
  }
  return (element.children ?? []).some(hasBoxNoneOverlay);
}

describe('Combobox.Portal', () => {
  it('renders in a Modal by default', async () => {
    await render(<TestPortal />);
    expect(JSON.stringify(screen.toJSON())).toContain('Modal');
  });

  it('renders as a non-Modal overlay when modal={false}, keeping the popup mounted', async () => {
    await render(<TestPortal modal={false} />);

    // No `Modal` in the tree, and the overlay's touch-transparent full-screen
    // view is present — the two things that let the field behind keep focus.
    expect(JSON.stringify(screen.toJSON())).not.toContain('Modal');
    expect(hasBoxNoneOverlay(screen.toJSON())).toBe(true);

    // The Positioner's "must be within Portal" guard is still satisfied, so the
    // popup mounts rather than throwing.
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('works the same on an Autocomplete', async () => {
    await render(
      <Autocomplete.Root items={FRUITS} defaultOpen>
        <Autocomplete.Portal modal={false}>
          <Autocomplete.Positioner>
            <Autocomplete.Popup testID="popup">
              <Autocomplete.List>
                {(item) => (
                  <Autocomplete.Item key={String(item.value)} item={item}>
                    <Text>{item.label}</Text>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    expect(JSON.stringify(screen.toJSON())).not.toContain('Modal');
    expect(screen.getByTestId('popup')).toBeTruthy();
  });
});
