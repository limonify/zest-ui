import * as React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Combobox } from '../../combobox';
import { Dialog } from '../../dialog';
import { Menu } from '../../menu';
import { Popover } from '../../popover';
import { Select } from '../../select';
import { Tooltip } from '../../tooltip';

type TreeNode = { type?: string; props?: Record<string, any>; children?: unknown[] };

function findNodeByProp(node: TreeNode, propName: string): TreeNode | null {
  if (node.props && node.props[propName] !== undefined) {
    return node;
  }
  for (const child of node.children ?? []) {
    if (typeof child === 'object' && child !== null) {
      const found = findNodeByProp(child as TreeNode, propName);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

type ModalProps = { onRequestClose?: (event: unknown) => void } & Record<string, any>;

/**
 * Every popup family renders its `Portal` as an RN `Modal` with the same four
 * defaults. `modalProps` is the consumer's way in — without it the Modal's own
 * `animationType="fade"` cannot be switched off, so a consumer-driven enter
 * animation is stuck riding on top of a native cross-fade.
 */
const FAMILIES: Array<{
  name: string;
  render: (modalProps: ModalProps) => React.ReactElement;
}> = [
  {
    name: 'Dialog',
    render: (modalProps) => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal modalProps={modalProps}>
          <Text>content</Text>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    name: 'Popover',
    render: (modalProps) => (
      <Popover.Root defaultOpen>
        <Popover.Portal modalProps={modalProps}>
          <Text>content</Text>
        </Popover.Portal>
      </Popover.Root>
    ),
  },
  {
    name: 'Menu',
    render: (modalProps) => (
      <Menu.Root defaultOpen>
        <Menu.Portal modalProps={modalProps}>
          <Text>content</Text>
        </Menu.Portal>
      </Menu.Root>
    ),
  },
  {
    name: 'Select',
    render: (modalProps) => (
      <Select.Root defaultOpen>
        <Select.Portal modalProps={modalProps}>
          <Text>content</Text>
        </Select.Portal>
      </Select.Root>
    ),
  },
  {
    name: 'Combobox',
    render: (modalProps) => (
      <Combobox.Root defaultOpen>
        <Combobox.Portal modalProps={modalProps}>
          <Text>content</Text>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
  {
    name: 'Tooltip',
    render: (modalProps) => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Portal modalProps={modalProps}>
          <Text>content</Text>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  },
];

describe.each(FAMILIES)('$name.Portal modalProps', ({ render: renderFamily }) => {
  it('forwards props to the Modal and lets them override the defaults', async () => {
    const view = await render(
      renderFamily({ animationType: 'none', hardwareAccelerated: true }),
    );

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');

    expect(modal).toBeTruthy();
    expect(modal!.props!.animationType).toBe('none');
    expect(modal!.props!.hardwareAccelerated).toBe(true);
    // Defaults that were not overridden survive.
    expect(modal!.props!.transparent).toBe(true);
    expect(modal!.props!.statusBarTranslucent).toBe(true);
  });

  it('keeps `visible` owned by the open state', async () => {
    const view = await render(renderFamily({ visible: false } as ModalProps));

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');

    expect(modal!.props!.visible).toBe(true);
  });

  it('chains onRequestClose instead of replacing it', async () => {
    const onRequestClose = jest.fn();
    const view = await render(renderFamily({ onRequestClose }));

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');
    await act(async () => {
      modal!.props!.onRequestClose({ nativeEvent: {} });
    });

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    // Zest's own handler still ran: the popup closed, so the Modal is gone.
    expect(findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose')).toBeNull();
  });
});
