import * as React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import {
  Combobox,
  ComboboxRootContext,
  ComboboxItemsContext,
  ComboboxSelectionContext,
  ComboboxTransitionContext,
  useComboboxRootContext,
  useComboboxItemsContext,
  useComboboxSelectionContext,
  useComboboxTransitionContext,
} from '../../index';

const FRUITS = ['Apple', 'Banana', 'Cherry'];

/**
 * Reads every context the root publishes and re-provides it one level down,
 * which is what a consumer does to move a combobox part outside the root's own
 * tree (e.g. into a hoisted overlay). The re-provision is the exported surface
 * under test; the hooks would work with or without it.
 */
function ReProvide({ children }: { children: React.ReactNode }) {
  const root = useComboboxRootContext();
  const items = useComboboxItemsContext();
  const selection = useComboboxSelectionContext();
  const transition = useComboboxTransitionContext();

  return (
    <ComboboxRootContext.Provider value={root}>
      <ComboboxItemsContext.Provider value={items}>
        <ComboboxSelectionContext.Provider value={selection}>
          <ComboboxTransitionContext.Provider value={transition}>
            {children}
          </ComboboxTransitionContext.Provider>
        </ComboboxSelectionContext.Provider>
      </ComboboxItemsContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

function CountProbe() {
  const items = useComboboxItemsContext();
  return <Text testID="count">{String(items.filteredItemCount)}</Text>;
}

describe('combobox contexts', () => {
  it('can be read and re-provided around a part outside the root tree', async () => {
    await render(
      <Combobox.Root items={FRUITS} defaultOpen>
        <ReProvide>
          <CountProbe />
        </ReProvide>
      </Combobox.Root>,
    );

    // The filtered items reach the re-provided subtree through the exported
    // context object, so a hoisted part still sees the same filtered list.
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });
});
