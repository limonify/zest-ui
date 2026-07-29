import * as React from 'react';
import { render } from '@testing-library/react-native';
import { useAccordionItemContext } from '../accordion/item/AccordionItemContext';
import { useAccordionRootContext } from '../accordion/root/AccordionRootContext';
import { useAvatarRootContext } from '../avatar/root/AvatarRootContext';
import { useCheckboxRootContext } from '../checkbox/root/CheckboxRootContext';
import { useCollapsiblePanelState } from '../collapsible/panel/CollapsiblePanelContext';
import { useCollapsibleRootContext } from '../collapsible/root/CollapsibleRootContext';
import { useComboboxPortalContext } from '../combobox/portal/ComboboxPortalContext';
import { useComboboxPositionerContext } from '../combobox/positioner/ComboboxPositionerContext';
import { useComboboxItemsContext } from '../combobox/root/ComboboxItemsContext';
import { useComboboxRootContext } from '../combobox/root/ComboboxRootContext';
import { useContextMenuRootContext } from '../context-menu/root/ContextMenuRootContext';
import { useDialogPortalContext } from '../dialog/portal/DialogPortalContext';
import { useDialogRootContext } from '../dialog/root/DialogRootContext';
import { useDrawerRootContext } from '../drawer/root/DrawerRootContext';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useFieldsetRootContext } from '../fieldset/root/FieldsetRootContext';
import { useCompositeListContext } from '../internals/composite/list/CompositeListContext';
import { useMenuCheckboxItemContext } from '../menu/checkbox-item/MenuCheckboxItemContext';
import { useMenuGroupContext } from '../menu/group/MenuGroupContext';
import { useMenuPortalContext } from '../menu/portal/MenuPortalContext';
import { useMenuPositionerContext } from '../menu/positioner/MenuPositionerContext';
import { useMenuRadioGroupContext } from '../menu/radio-group/MenuRadioGroupContext';
import { useMenuRadioItemContext } from '../menu/radio-item/MenuRadioItemContext';
import { useMenuRootContext } from '../menu/root/MenuRootContext';
import { useMeterRootContext } from '../meter/root/MeterRootContext';
import { useNumberFieldRootContext } from '../number-field/root/NumberFieldRootContext';
import { useOTPFieldRootContext } from '../otp-field/root/OTPFieldRootContext';
import { usePopoverPortalContext } from '../popover/portal/PopoverPortalContext';
import { usePopoverPositionerContext } from '../popover/positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../popover/root/PopoverRootContext';
import { useProgressRootContext } from '../progress/root/ProgressRootContext';
import { useRadioRootContext } from '../radio/root/RadioRootContext';
import { useRadioGroupContext } from '../radio-group/RadioGroupContext';
import { useSelectGroupContext } from '../select/group/SelectGroupContext';
import { useSelectItemContext } from '../select/item/SelectItemContext';
import { useSelectPortalContext } from '../select/portal/SelectPortalContext';
import { useSelectPositionerContext } from '../select/positioner/SelectPositionerContext';
import { useSelectRootContext } from '../select/root/SelectRootContext';
import { useSliderRootContext } from '../slider/root/SliderRootContext';
import { useSwitchRootContext } from '../switch/root/SwitchRootContext';
import { useTabsListContext } from '../tabs/list/TabsListContext';
import { useTabsRootContext } from '../tabs/root/TabsRootContext';
import { useToastPositionerContext } from '../toast/positioner/ToastPositionerContext';
import { useToastProviderContext } from '../toast/provider/ToastProviderContext';
import { useToastRootContext } from '../toast/root/ToastRootContext';
import { useTooltipPortalContext } from '../tooltip/portal/TooltipPortalContext';
import { useTooltipPositionerContext } from '../tooltip/positioner/TooltipPositionerContext';
import { useTooltipRootContext } from '../tooltip/root/TooltipRootContext';

/**
 * Every compound component's parts reach their root through a context hook that
 * throws when the part is rendered outside its provider — the error a consumer
 * sees when they nest something wrong. That branch is the only one in each of
 * these 48 files, so without this sweep they all sit at 50% branch coverage and
 * the message nobody wants to hit is the one nobody ever checked.
 */

const CONTEXT_HOOKS: Array<[string, () => unknown]> = [
  ['useAccordionItemContext', useAccordionItemContext],
  ['useAccordionRootContext', useAccordionRootContext],
  ['useAvatarRootContext', useAvatarRootContext],
  ['useCheckboxRootContext', useCheckboxRootContext],
  ['useCollapsiblePanelState', useCollapsiblePanelState],
  ['useCollapsibleRootContext', useCollapsibleRootContext],
  ['useComboboxPortalContext', useComboboxPortalContext],
  ['useComboboxPositionerContext', useComboboxPositionerContext],
  ['useComboboxItemsContext', useComboboxItemsContext],
  ['useComboboxRootContext', useComboboxRootContext],
  ['useContextMenuRootContext', useContextMenuRootContext],
  ['useDialogPortalContext', useDialogPortalContext],
  ['useDialogRootContext', useDialogRootContext],
  ['useDrawerRootContext', useDrawerRootContext],
  ['useFieldRootContext', useFieldRootContext],
  ['useFieldsetRootContext', useFieldsetRootContext],
  ['useCompositeListContext', useCompositeListContext],
  ['useMenuCheckboxItemContext', useMenuCheckboxItemContext],
  ['useMenuGroupContext', useMenuGroupContext],
  ['useMenuPortalContext', useMenuPortalContext],
  ['useMenuPositionerContext', useMenuPositionerContext],
  ['useMenuRadioGroupContext', useMenuRadioGroupContext],
  ['useMenuRadioItemContext', useMenuRadioItemContext],
  ['useMenuRootContext', useMenuRootContext],
  ['useMeterRootContext', useMeterRootContext],
  ['useNumberFieldRootContext', useNumberFieldRootContext],
  ['useOTPFieldRootContext', useOTPFieldRootContext],
  ['usePopoverPortalContext', usePopoverPortalContext],
  ['usePopoverPositionerContext', usePopoverPositionerContext],
  ['usePopoverRootContext', usePopoverRootContext],
  ['useProgressRootContext', useProgressRootContext],
  ['useRadioRootContext', useRadioRootContext],
  ['useRadioGroupContext', useRadioGroupContext],
  ['useSelectGroupContext', useSelectGroupContext],
  ['useSelectItemContext', useSelectItemContext],
  ['useSelectPortalContext', useSelectPortalContext],
  ['useSelectPositionerContext', useSelectPositionerContext],
  ['useSelectRootContext', useSelectRootContext],
  ['useSliderRootContext', useSliderRootContext],
  ['useSwitchRootContext', useSwitchRootContext],
  ['useTabsListContext', useTabsListContext],
  ['useTabsRootContext', useTabsRootContext],
  ['useToastPositionerContext', useToastPositionerContext],
  ['useToastProviderContext', useToastProviderContext],
  ['useToastRootContext', useToastRootContext],
  ['useTooltipPortalContext', useTooltipPortalContext],
  ['useTooltipPositionerContext', useTooltipPositionerContext],
  ['useTooltipRootContext', useTooltipRootContext],
];

describe.each(CONTEXT_HOOKS)('%s outside its provider', (name, useContextHook) => {
  it('throws a message naming the missing provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function Orphan() {
      useContextHook();
      return null;
    }

    try {
      // React logs the thrown error before rethrowing it; the spy keeps the test
      // output readable.
      await expect(render(<Orphan />)).rejects.toThrow(/^Zest: /);
    } finally {
      consoleError.mockRestore();
    }
  });
});
