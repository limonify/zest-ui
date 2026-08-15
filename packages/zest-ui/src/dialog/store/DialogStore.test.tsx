import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Dialog } from '../index';
import { useDialogRootContext } from '../root/DialogRootContext';
import type { DialogStore } from './DialogStore';

let storeRef: DialogStore | undefined;

/**
 * Exposes the root's store so the test can drive `settled` exactly the way a
 * consumer would after their animation ends.
 */
function StoreHarness() {
  storeRef = useDialogRootContext();
  return null;
}

function TestDialog(props: { onOpenChangeComplete?: (open: boolean) => void }) {
  return (
    <Dialog.Root onOpenChangeComplete={props.onOpenChangeComplete}>
      <StoreHarness />
      <Dialog.Trigger testID="trigger">
        <Text>Open</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop testID="backdrop" />
        <Dialog.Viewport testID="viewport">
          <Dialog.Popup testID="popup">
            <Dialog.Close testID="close">
              <Text>Close</Text>
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

describe('Dialog.onOpenChangeComplete via store.settled', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('fires for a settled open, with the reason of the change', async () => {
    const onOpenChangeComplete = jest.fn();
    await render(<TestDialog onOpenChangeComplete={onOpenChangeComplete} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    storeRef!.settled(true);

    expect(onOpenChangeComplete).toHaveBeenCalledTimes(1);
    expect(onOpenChangeComplete).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
  });

  it('fires once per settle, not on repeat calls with the same value', async () => {
    const onOpenChangeComplete = jest.fn();
    await render(<TestDialog onOpenChangeComplete={onOpenChangeComplete} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    storeRef!.settled(true);
    storeRef!.settled(true);

    expect(onOpenChangeComplete).toHaveBeenCalledTimes(1);
  });

  it('fires again for the settle of the next open', async () => {
    const onOpenChangeComplete = jest.fn();
    await render(<TestDialog onOpenChangeComplete={onOpenChangeComplete} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));
    storeRef!.settled(true);
    await user.press(screen.getByTestId('close'));
    storeRef!.settled(false);
    await user.press(screen.getByTestId('trigger'));
    storeRef!.settled(true);

    expect(onOpenChangeComplete).toHaveBeenCalledTimes(3);
    expect(onOpenChangeComplete.mock.calls.map(([open]) => open)).toEqual([true, false, true]);
  });
});
