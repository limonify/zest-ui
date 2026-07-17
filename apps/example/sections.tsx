import * as React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import {
  Accordion,
  AlertDialog,
  Autocomplete,
  Avatar,
  Button,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  Combobox,
  ContextMenu,
  createDialogHandle,
  Dialog,
  Drawer,
  Field,
  Fieldset,
  Input,
  Menu,
  Meter,
  NumberField,
  OTPField,
  Popover,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tabs,
  Toast,
  Toggle,
  ToggleGroup,
  Tooltip,
} from '@limonify/zest-ui';
import { styles } from './styles';

export function ButtonSection() {
  const [count, setCount] = React.useState(0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Button</Text>
      <Button
        onPress={() => setCount((c) => c + 1)}
        style={(state) => [
          styles.button,
          state.pressed && styles.buttonPressed,
          state.disabled && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>Pressed {count} times</Text>
      </Button>
      <Button disabled style={(state) => [styles.button, state.disabled && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>Disabled</Text>
      </Button>
    </View>
  );
}

export function CheckboxSection() {
  const [checked, setChecked] = React.useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Checkbox</Text>
      <View style={styles.row}>
        <Checkbox.Root
          checked={checked}
          onCheckedChange={setChecked}
          style={(state) => [styles.checkboxBox, state.checked && styles.checkboxBoxChecked]}
        >
          <Checkbox.Indicator>
            <Text style={styles.checkboxTick}>✓</Text>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Text style={styles.label}>{checked ? 'Checked (controlled)' : 'Unchecked (controlled)'}</Text>
      </View>
      <View style={styles.row}>
        <Checkbox.Root
          defaultChecked
          style={(state) => [styles.checkboxBox, state.checked && styles.checkboxBoxChecked]}
        >
          <Checkbox.Indicator>
            <Text style={styles.checkboxTick}>✓</Text>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Text style={styles.label}>Uncontrolled with defaultChecked</Text>
      </View>
    </View>
  );
}

/**
 * Fades a collapsible/accordion panel in when it mounts.
 *
 * The panel is rendered only while open (no `keepMounted`), so it lays out at
 * its natural height — the content is always visible. This keeps the demo robust
 * across layout engines: it does not depend on animating a measured height,
 * which is fragile on the New Architecture. zest still publishes `height` and
 * `transitionStatus` on the panel state for consumers who want to drive a height
 * animation themselves — see the Collapsible docs.
 */
export function AnimatedPanel(props: { style?: unknown; children?: React.ReactNode }) {
  const { style, children, ...rest } = props;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View {...rest} style={[style as never, { opacity }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Slides the tab indicator to the active tab. The indicator publishes the active
 * tab's measured position and size on its state — the counterpart of the web
 * version's `--active-tab-*` CSS variables — and the consumer animates it.
 */
export function TabsIndicatorBar(props: {
  left: number;
  width: number;
  style?: unknown;
}) {
  const { left, width, style, ...rest } = props;
  const animatedLeft = React.useRef(new Animated.Value(left)).current;
  const animatedWidth = React.useRef(new Animated.Value(width)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedLeft, { toValue: left, useNativeDriver: false, bounciness: 0 }),
      Animated.spring(animatedWidth, { toValue: width, useNativeDriver: false, bounciness: 0 }),
    ]).start();
  }, [left, width, animatedLeft, animatedWidth]);

  return (
    <Animated.View
      {...rest}
      style={[style as never, { left: animatedLeft, width: animatedWidth }]}
    />
  );
}

export function TabsSection() {
  const items = [
    { value: 'overview', label: 'Overview', body: 'A headless tab set: no styling shipped.' },
    { value: 'activity', label: 'Activity', body: 'Panels mount only while selected.' },
    { value: 'settings', label: 'Settings', body: 'The indicator follows the active tab.' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tabs</Text>
      <Tabs.Root defaultValue="overview" style={styles.group}>
        <Tabs.List style={styles.tabsList}>
          {items.map((item) => (
            <Tabs.Tab key={item.value} value={item.value} style={styles.tab}>
              <Text style={styles.label}>{item.label}</Text>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator
            style={styles.tabsIndicator}
            render={(props, state) => (
              <TabsIndicatorBar
                {...props}
                left={state.selectedTabPosition?.left ?? 0}
                width={state.selectedTabSize?.width ?? 0}
              />
            )}
          />
        </Tabs.List>
        {items.map((item) => (
          <Tabs.Panel key={item.value} value={item.value} style={styles.panelBody}>
            <Text style={styles.label}>{item.body}</Text>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </View>
  );
}

export function CollapsibleSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Collapsible</Text>
      <Collapsible.Root defaultOpen style={styles.group}>
        <Collapsible.Trigger
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Toggle details</Text>
        </Collapsible.Trigger>
        <Collapsible.Panel render={(props) => <AnimatedPanel {...props} />}>
          <View style={styles.panelBody}>
            <Text style={styles.label}>
              The panel renders only while open, so it lays out at its natural height and its
              content is always visible; this example fades it in with RN's built-in Animated. The
              panel also publishes its measured height on state if you want to animate that instead.
            </Text>
          </View>
        </Collapsible.Panel>
      </Collapsible.Root>
    </View>
  );
}

export function AccordionSection() {
  const items = [
    { value: 'shipping', title: 'Shipping', body: 'Ships in 2–4 business days.' },
    { value: 'returns', title: 'Returns', body: 'Free returns within 30 days of delivery.' },
    { value: 'support', title: 'Support', body: 'Reach us any weekday between 9:00 and 18:00.' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Accordion</Text>
      <Accordion.Root defaultValue={['shipping']} style={styles.group}>
        {items.map((item) => (
          <Accordion.Item key={item.value} value={item.value} style={styles.accordionItem}>
            <Accordion.Header>
              <Accordion.Trigger
                style={(state) => [styles.accordionTrigger, state.pressed && styles.togglePressed]}
                render={(props, state) => (
                  <Pressable {...props}>
                    <Text style={styles.accordionTitle}>{item.title}</Text>
                    <Text style={styles.label}>{state.open ? '⌃' : '⌄'}</Text>
                  </Pressable>
                )}
              />
            </Accordion.Header>
            <Accordion.Panel render={(props) => <AnimatedPanel {...props} />}>
              <View style={styles.panelBody}>
                <Text style={styles.label}>{item.body}</Text>
              </View>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </View>
  );
}

export const COLORS = ['red', 'green', 'blue'];

export function CheckboxGroupSection() {
  const [value, setValue] = React.useState<string[]>(['red']);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CheckboxGroup (parent checkbox)</Text>
      <CheckboxGroup allValues={COLORS} value={value} onValueChange={setValue} style={styles.group}>
        <View style={styles.row}>
          <Checkbox.Root
            parent
            style={(state) => [styles.checkboxBox, state.checked && styles.checkboxBoxChecked]}
          >
            <Checkbox.Indicator>
              {/* The parent reports a mixed state while only some children are ticked. */}
              <Text style={styles.checkboxTick}>{value.length === COLORS.length ? '✓' : '–'}</Text>
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Text style={styles.label}>Select all</Text>
        </View>
        {COLORS.map((color) => (
          <View key={color} style={[styles.row, styles.indented]}>
            <Checkbox.Root
              value={color}
              style={(state) => [styles.checkboxBox, state.checked && styles.checkboxBoxChecked]}
            >
              <Checkbox.Indicator>
                <Text style={styles.checkboxTick}>✓</Text>
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Text style={styles.label}>{color}</Text>
          </View>
        ))}
      </CheckboxGroup>
      <Text style={styles.label}>Value: [{value.join(', ')}]</Text>
    </View>
  );
}

export function SwitchSection() {
  const [checked, setChecked] = React.useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Switch</Text>
      <View style={styles.row}>
        <Switch.Root
          checked={checked}
          onCheckedChange={setChecked}
          style={(state) => [styles.switchTrack, state.checked && styles.switchTrackChecked]}
        >
          <Switch.Thumb
            style={(state) => [styles.switchThumb, state.checked && styles.switchThumbChecked]}
          />
        </Switch.Root>
        <Text style={styles.label}>{checked ? 'On' : 'Off'}</Text>
      </View>
      <View style={styles.row}>
        <Switch.Root
          disabled
          defaultChecked
          style={(state) => [
            styles.switchTrack,
            state.checked && styles.switchTrackChecked,
            state.disabled && styles.buttonDisabled,
          ]}
        >
          <Switch.Thumb
            style={(state) => [styles.switchThumb, state.checked && styles.switchThumbChecked]}
          />
        </Switch.Root>
        <Text style={styles.label}>Disabled</Text>
      </View>
    </View>
  );
}

export function ToggleSection() {
  const [formatting, setFormatting] = React.useState<string[]>(['bold']);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Toggle & ToggleGroup</Text>
      <Toggle style={(state) => [styles.toggle, state.pressed && styles.togglePressed]}>
        <Text style={styles.label}>Standalone toggle</Text>
      </Toggle>

      <ToggleGroup multiple value={formatting} onValueChange={setFormatting} style={styles.row}>
        {['bold', 'italic', 'underline'].map((item) => (
          <Toggle
            key={item}
            value={item}
            style={(state) => [styles.toggle, state.pressed && styles.togglePressed]}
          >
            <Text style={styles.label}>{item}</Text>
          </Toggle>
        ))}
      </ToggleGroup>
      <Text style={styles.label}>Pressed: [{formatting.join(', ')}]</Text>
    </View>
  );
}

export function RadioSection() {
  const [value, setValue] = React.useState('apple');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>RadioGroup</Text>
      <RadioGroup value={value} onValueChange={setValue} style={styles.group}>
        {['apple', 'banana', 'cherry'].map((fruit) => (
          <View key={fruit} style={styles.row}>
            <Radio.Root value={fruit} style={styles.radioOuter}>
              <Radio.Indicator style={styles.radioInner} />
            </Radio.Root>
            <Text style={styles.label}>{fruit}</Text>
          </View>
        ))}
      </RadioGroup>
      <Text style={styles.label}>Value: {value}</Text>
    </View>
  );
}

export function AlertDialogSection() {
  const [lastReason, setLastReason] = React.useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AlertDialog</Text>
      <Text style={styles.label}>
        Unlike Dialog, pressing the backdrop does nothing — an alert must be dismissed deliberately.
      </Text>
      {lastReason ? <Text style={styles.label}>Last close reason: {lastReason}</Text> : null}

      <AlertDialog.Root
        onOpenChange={(nextOpen, eventDetails) => {
          if (!nextOpen) {
            setLastReason(eventDetails.reason);
          }
        }}
      >
        <AlertDialog.Trigger
          style={(state) => [styles.button, styles.buttonDanger, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Delete file</Text>
        </AlertDialog.Trigger>

        <AlertDialog.Portal>
          <AlertDialog.Backdrop style={styles.backdrop} />
          <AlertDialog.Viewport style={styles.viewport}>
            <AlertDialog.Popup style={styles.popup}>
              <AlertDialog.Title style={styles.dialogTitle}>Delete file?</AlertDialog.Title>
              <AlertDialog.Description style={styles.dialogDescription}>
                This permanently deletes the file. This action cannot be undone.
              </AlertDialog.Description>
              <View style={styles.row}>
                <AlertDialog.Close
                  style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </AlertDialog.Close>
                <AlertDialog.Close
                  style={(state) => [
                    styles.button,
                    styles.buttonDanger,
                    state.pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </AlertDialog.Close>
              </View>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </View>
  );
}

export function DialogSection() {
  const [open, setOpen] = React.useState(false);
  const [lastReason, setLastReason] = React.useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Dialog</Text>
      {lastReason ? <Text style={styles.label}>Last close reason: {lastReason}</Text> : null}

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setLastReason(eventDetails.reason);
          }
        }}
      >
        <Dialog.Trigger style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Open dialog</Text>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop style={styles.backdrop} />
          <Dialog.Viewport style={styles.viewport}>
            <Dialog.Popup style={styles.popup}>
              <Dialog.Title style={styles.dialogTitle}>Confirm action</Dialog.Title>
              <Dialog.Description style={styles.dialogDescription}>
                This dialog is fully headless: the dimmed backdrop, the centered card, and every
                other visual detail comes from the consumer's StyleSheet.
              </Dialog.Description>
              <Dialog.Close
                style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
              >
                <Text style={styles.buttonText}>Close</Text>
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </View>
  );
}

export function PopoverSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Popover</Text>
      <Text style={styles.label}>
        Anchored to its trigger by @floating-ui/react-native. Flips to the other side when it would
        collide with the screen edge.
      </Text>

      <Popover.Root>
        <Popover.Trigger style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Show popover</Text>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Backdrop style={styles.transparentBackdrop} />
          <Popover.Positioner side="top" align="center" sideOffset={8}>
            <Popover.Popup style={styles.floatingPopup}>
              <Popover.Arrow style={styles.arrow} />
              <Popover.Title style={styles.dialogTitle}>Popover title</Popover.Title>
              <Popover.Description style={styles.dialogDescription}>
                The Positioner does the placement; the Popup is just a View you style.
              </Popover.Description>
              <Popover.Close style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
                <Text style={styles.buttonText}>Close</Text>
              </Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </View>
  );
}

export function TooltipSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tooltip</Text>
      <Text style={styles.label}>
        Diverges from the web on purpose: a touch screen has no hover and no focus ring, so a
        tooltip opens on press (or long press) and closes on an outside press.
      </Text>

      <Tooltip.Root>
        <Tooltip.Trigger
          longPress
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Long-press me</Text>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Positioner side="top" sideOffset={6}>
            <Tooltip.Popup style={styles.tooltipPopup}>
              <Tooltip.Arrow style={styles.tooltipArrow} />
              <Text style={styles.tooltipText}>Opened by long press</Text>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </View>
  );
}

export function MenuSection() {
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [gridlines, setGridlines] = React.useState(false);
  const [size, setSize] = React.useState('md');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Menu</Text>
      <Text style={styles.label}>
        Submenus open on press, not hover — and each one is a Modal nested inside its parent's.
      </Text>
      {lastAction ? <Text style={styles.label}>Last action: {lastAction}</Text> : null}

      <Menu.Root>
        <Menu.Trigger style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Open menu</Text>
        </Menu.Trigger>

        <Menu.Portal>
          {/* A faint scrim, like a native dropdown. Tapping it anywhere dismisses
              the menu — it fills the whole screen behind the popup. */}
          <Menu.Backdrop style={styles.menuBackdrop} />
          <Menu.Positioner side="bottom" align="start" sideOffset={4}>
            <Menu.Popup style={styles.floatingPopup}>
              <Menu.Group>
                <Menu.GroupLabel style={styles.groupLabel}>Actions</Menu.GroupLabel>
                {['Duplicate', 'Rename'].map((action) => (
                  <Menu.Item
                    key={action}
                    onPress={() => setLastAction(action)}
                    style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                  >
                    <Text style={styles.label}>{action}</Text>
                  </Menu.Item>
                ))}
              </Menu.Group>
              <Menu.Separator style={styles.separator} />

              <Menu.CheckboxItem
                checked={gridlines}
                onCheckedChange={setGridlines}
                style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
              >
                <Text style={styles.label}>Show gridlines</Text>
                <Menu.CheckboxItemIndicator>
                  <Text style={styles.label}>✓</Text>
                </Menu.CheckboxItemIndicator>
              </Menu.CheckboxItem>

              <Menu.Separator style={styles.separator} />
              <Menu.RadioGroup value={size} onValueChange={setSize}>
                <Menu.GroupLabel style={styles.groupLabel}>Size</Menu.GroupLabel>
                {['sm', 'md', 'lg'].map((option) => (
                  <Menu.RadioItem
                    key={option}
                    value={option}
                    style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                  >
                    <Text style={styles.label}>{option}</Text>
                    <Menu.RadioItemIndicator>
                      <Text style={styles.label}>•</Text>
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>

              <Menu.Separator style={styles.separator} />
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger
                  style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                >
                  <Text style={styles.label}>Share</Text>
                  <Text style={styles.label}>›</Text>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  {/* Each menu level is its own Modal and needs its own backdrop
                      to be dismissable by an outside tap — the parent's does not
                      reach into the submenu's Modal. Tapping here closes just the
                      submenu, back to the parent. */}
                  <Menu.Backdrop style={styles.transparentBackdrop} />
                  <Menu.Positioner side="right" align="start" sideOffset={4}>
                    <Menu.Popup style={styles.floatingPopup}>
                      {['Email', 'Copy link'].map((action) => (
                        <Menu.Item
                          key={action}
                          onPress={() => setLastAction(action)}
                          style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                        >
                          <Text style={styles.label}>{action}</Text>
                        </Menu.Item>
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Separator style={styles.separator} />
              <Menu.Item
                onPress={() => setLastAction('Delete')}
                style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
              >
                <Text style={[styles.label, styles.dangerText]}>Delete</Text>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </View>
  );
}

export const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

export function ContextMenuSection() {
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Context Menu</Text>
      <Text style={styles.label}>
        A menu opened by long-pressing an area rather than tapping a button. It appears where your
        finger landed.
      </Text>
      {lastAction ? <Text style={styles.label}>Last action: {lastAction}</Text> : null}

      <ContextMenu.Root>
        <ContextMenu.Trigger style={styles.contextArea}>
          <Text style={styles.label}>Long-press this card</Text>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Backdrop style={styles.transparentBackdrop} />
          <ContextMenu.Positioner>
            <ContextMenu.Popup style={styles.floatingPopup}>
              {['Copy', 'Duplicate', 'Delete'].map((action) => (
                <ContextMenu.Item
                  key={action}
                  onPress={() => setLastAction(action)}
                  style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                >
                  <Text style={[styles.label, action === 'Delete' && styles.dangerText]}>
                    {action}
                  </Text>
                </ContextMenu.Item>
              ))}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </View>
  );
}

export const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Denmark',
  'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Iceland', 'India', 'Ireland', 'Italy',
  'Japan', 'Mexico', 'Netherlands', 'Norway', 'Portugal', 'Spain', 'Sweden', 'Turkey',
];

export function ComboboxSection() {
  const [value, setValue] = React.useState<unknown>(null);
  const [tag, setTag] = React.useState('');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Combobox / Autocomplete</Text>
      <Text style={styles.label}>
        A text input that filters a list. Combobox selects one value; Autocomplete is free text with
        suggestions. Type to filter, then tap a row.
      </Text>
      {value != null ? <Text style={styles.label}>Selected: {String(value)}</Text> : null}

      <Combobox.Root items={COUNTRIES} value={value} onValueChange={setValue}>
        <Combobox.Input placeholder="Pick a country" style={styles.fieldControl} />
        <Combobox.Portal>
          <Combobox.Backdrop style={styles.transparentBackdrop} />
          <Combobox.Positioner>
            <Combobox.Popup style={[styles.floatingPopup, styles.comboboxPopup]}>
              <Combobox.Empty style={styles.comboboxEmpty}>
                <Text style={styles.label}>No match</Text>
              </Combobox.Empty>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item
                    key={String(item.value)}
                    item={item}
                    style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                  >
                    <Text style={styles.label}>{item.label}</Text>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <Text style={styles.label}>Autocomplete (free text): {tag || '—'}</Text>
      <Autocomplete.Root
        items={['bug', 'feature', 'docs', 'design', 'chore']}
        inputValue={tag}
        onInputValueChange={setTag}
      >
        <Autocomplete.Input placeholder="Add a tag" style={styles.fieldControl} />
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup style={[styles.floatingPopup, styles.comboboxPopup]}>
              <Autocomplete.List>
                {(item) => (
                  <Autocomplete.Item
                    key={String(item.value)}
                    item={item}
                    style={(state) => [styles.menuItem, state.pressed && styles.menuItemPressed]}
                  >
                    <Text style={styles.label}>{item.label}</Text>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </View>
  );
}

export function FieldSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Field / Input</Text>
      <Text style={styles.label}>
        Field wires a label, a TextInput, a description and validation together for accessibility.
        This one validates on blur; the error shows the message `validate` returned.
      </Text>

      <Field.Root
        validate={(value) =>
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value as string) ? null : 'Enter a valid email'
        }
        style={styles.fieldRoot}
      >
        <Field.Label style={styles.fieldLabel}>Email</Field.Label>
        <Field.Control
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={(state) => [
            styles.fieldControl,
            state.focused && styles.fieldControlFocused,
            state.valid === false && styles.fieldControlInvalid,
          ]}
        />
        <Field.Description style={styles.fieldDescription}>
          We only use it to sign you in.
        </Field.Description>
        <Field.Error style={styles.fieldError} />
      </Field.Root>

      <Text style={styles.label}>A standalone Input, and a disabled Fieldset:</Text>
      <Input placeholder="Standalone input" style={styles.fieldControl} />

      <Text style={styles.label}>A Checkbox inside a Field is labelled by Field.Label:</Text>
      <Field.Root style={styles.fieldRoot}>
        <View style={styles.row}>
          <Checkbox.Root
            style={(state) => [styles.checkboxBox, state.checked && styles.checkboxBoxChecked]}
          >
            <Checkbox.Indicator>
              <Text style={styles.checkboxTick}>✓</Text>
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Field.Label style={styles.label}>I accept the terms</Field.Label>
        </View>
      </Field.Root>

      <Fieldset.Root disabled style={styles.fieldRoot}>
        <Fieldset.Legend style={styles.fieldLabel}>Disabled group</Fieldset.Legend>
        <Field.Root>
          <Field.Control placeholder="Can't edit me" style={styles.fieldControl} />
        </Field.Root>
      </Fieldset.Root>
    </View>
  );
}

export function SelectSection() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select</Text>
      <Text style={styles.label}>
        `items` lets Select.Value render a label before the popup has ever opened — the items live
        in the Portal and are not mounted until then.
      </Text>

      <Select.Root items={FRUITS} value={value} onValueChange={setValue}>
        <Select.Label style={[styles.label, styles.selectLabel]}>Fruit</Select.Label>
        <Select.Trigger style={(state) => [styles.selectTrigger, state.pressed && styles.buttonPressed]}>
          <Select.Value style={styles.label}>
            {(state) => state.label ?? 'Pick a fruit'}
          </Select.Value>
          <Select.Icon style={styles.label}>
            <Text style={styles.label}>▾</Text>
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Backdrop style={styles.transparentBackdrop} />
          <Select.Positioner side="bottom" align="start" sideOffset={8}>
            <Select.Arrow style={styles.selectArrow} />
            <Select.Popup style={styles.floatingPopup}>
              <Select.List>
                {FRUITS.map((fruit) => (
                  <Select.Item
                    key={fruit.value}
                    value={fruit.value}
                    style={(state) => [styles.menuItem, state.selected && styles.menuItemSelected]}
                  >
                    <Select.ItemText style={styles.label}>{fruit.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Text style={styles.label}>✓</Text>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </View>
  );
}

export function MultiSelectSection() {
  const [values, setValues] = React.useState<string[]>(['apple']);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select (multiple)</Text>
      <Text style={styles.label}>
        A multiple select toggles items instead of replacing, and stays open until dismissed.
      </Text>

      <Select.Root multiple items={FRUITS} value={values} onValueChange={setValues}>
        <Select.Trigger style={(state) => [styles.selectTrigger, state.pressed && styles.buttonPressed]}>
          <Select.Value style={styles.label}>
            {(state) => (state.labels.length > 0 ? state.labels.join(' + ') : 'Pick fruit')}
          </Select.Value>
          <Select.Icon style={styles.label}>
            <Text style={styles.label}>▾</Text>
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Backdrop style={styles.transparentBackdrop} />
          <Select.Positioner side="bottom" align="start" sideOffset={4}>
            <Select.Popup style={styles.floatingPopup}>
              <Select.List>
                {FRUITS.map((fruit) => (
                  <Select.Item
                    key={fruit.value}
                    value={fruit.value}
                    style={(state) => [styles.menuItem, state.selected && styles.menuItemSelected]}
                  >
                    <Select.ItemText style={styles.label}>{fruit.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Text style={styles.label}>✓</Text>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </View>
  );
}

/**
 * A handle is what lets a trigger live outside its root — there is no context
 * reaching across — and lets anything else open the dialog imperatively.
 */
export const confirmDialog = createDialogHandle<{ file: string }>();

export function HandleSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Handles</Text>
      <Text style={styles.label}>
        Both buttons drive the same Dialog.Root below, which neither of them contains.
      </Text>

      <View style={styles.row}>
        <Dialog.Trigger
          handle={confirmDialog}
          payload={{ file: 'report.pdf' }}
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Detached trigger</Text>
        </Dialog.Trigger>

        <Button
          onPress={() => confirmDialog.openWithPayload({ file: 'imperative.txt' })}
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Imperative</Text>
        </Button>
      </View>

      <Dialog.Root handle={confirmDialog}>
        {(payload) => (
          <Dialog.Portal>
            <Dialog.Backdrop style={styles.backdrop} />
            <Dialog.Viewport style={styles.viewport}>
              <Dialog.Popup style={styles.popup}>
                <Dialog.Title style={styles.dialogTitle}>Delete {payload?.file}?</Dialog.Title>
                <Dialog.Description style={styles.dialogDescription}>
                  The payload came from whichever button opened this dialog.
                </Dialog.Description>
                <Dialog.Close style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
                  <Text style={styles.buttonText}>Close</Text>
                </Dialog.Close>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </View>
  );
}

export function SliderSection() {
  const [range, setRange] = React.useState<readonly number[]>([20, 60]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Slider</Text>

      <Slider.Root defaultValue={40} style={styles.group}>
        <View style={styles.row}>
          <Slider.Label style={styles.label}>Volume</Slider.Label>
          <Slider.Value style={styles.label} />
        </View>
        <Slider.Control style={styles.sliderControl}>
          <Slider.Track style={styles.sliderTrack}>
            <Slider.Indicator style={styles.sliderIndicator} />
            <Slider.Thumb style={(state) => [styles.sliderThumb, state.dragging && styles.sliderThumbActive]} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Text style={styles.label}>Range, with a minimum gap of 10 steps between the thumbs:</Text>
      <Slider.Root
        value={range}
        onValueChange={setRange}
        minStepsBetweenValues={10}
        style={styles.group}
      >
        <Slider.Value style={styles.label} />
        <Slider.Control style={styles.sliderControl}>
          <Slider.Track style={styles.sliderTrack}>
            <Slider.Indicator style={styles.sliderIndicator} />
            <Slider.Thumb index={0} style={styles.sliderThumb} />
            <Slider.Thumb index={1} style={styles.sliderThumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </View>
  );
}

export function DrawerSection() {
  const [lastReason, setLastReason] = React.useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Drawer</Text>
      <Text style={styles.label}>
        A dialog you can also swipe away. Following the animation contract, the popup never moves
        itself: it publishes `swipeMovement`, and the transform below is the consumer's.
      </Text>
      {lastReason ? <Text style={styles.label}>Last close reason: {lastReason}</Text> : null}

      <Drawer.Root
        swipeDirection="down"
        onOpenChange={(nextOpen, eventDetails) => {
          if (!nextOpen) {
            setLastReason(eventDetails.reason);
          }
        }}
      >
        <Drawer.Trigger style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Open drawer</Text>
        </Drawer.Trigger>

        <Text style={styles.label}>…or swipe up from the strip below to open it:</Text>
        <Drawer.SwipeArea style={styles.drawerSwipeArea} />

        <Drawer.Portal>
          <Drawer.Backdrop style={styles.backdrop} />
          <Drawer.Viewport style={styles.drawerViewport}>
            <Drawer.Popup
              style={(state) => [
                styles.drawerPopup,
                { transform: [{ translateY: state.swipeMovement }] },
              ]}
            >
              <View style={styles.drawerHandle} />
              <Drawer.Title style={styles.dialogTitle}>Swipe me down</Drawer.Title>
              <Drawer.Description style={styles.dialogDescription}>
                Drag this sheet downwards past 40px to dismiss it, or press the backdrop.
              </Drawer.Description>
              <Drawer.Close style={(state) => [styles.button, state.pressed && styles.buttonPressed]}>
                <Text style={styles.buttonText}>Close</Text>
              </Drawer.Close>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </View>
  );
}

export function MeterSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Meter</Text>
      <Text style={styles.label}>
        A static gauge (like disk usage), not a task in progress — no indeterminate state.
      </Text>

      <Meter.Root value={72} style={styles.group}>
        <View style={styles.row}>
          <Meter.Label style={styles.label}>Storage used</Meter.Label>
          <Meter.Value style={styles.label} />
        </View>
        <Meter.Track style={styles.progressTrack}>
          <Meter.Indicator style={styles.progressIndicator} />
        </Meter.Track>
      </Meter.Root>
    </View>
  );
}

export function ProgressSection() {
  const [value, setValue] = React.useState(30);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progress</Text>

      <Progress.Root value={value} style={styles.group}>
        <View style={styles.row}>
          <Progress.Label style={styles.label}>Uploading</Progress.Label>
          <Progress.Value style={styles.label} />
        </View>
        <Progress.Track style={styles.progressTrack}>
          <Progress.Indicator
            style={(state) => [
              styles.progressIndicator,
              state.status === 'complete' && styles.progressIndicatorComplete,
            ]}
          />
        </Progress.Track>
      </Progress.Root>

      <View style={styles.row}>
        <Button
          onPress={() => setValue((v) => Math.max(0, v - 25))}
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>-25</Text>
        </Button>
        <Button
          onPress={() => setValue((v) => Math.min(100, v + 25))}
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>+25</Text>
        </Button>
      </View>

      <Text style={styles.label}>
        Indeterminate: no width is applied at all, so the appearance is entirely yours.
      </Text>
      <Progress.Root value={null}>
        <Progress.Track style={styles.progressTrack}>
          <Progress.Indicator style={styles.progressIndicatorIndeterminate} />
        </Progress.Track>
      </Progress.Root>
    </View>
  );
}

export function AvatarSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Avatar</Text>
      <Text style={styles.label}>
        The second avatar's image 404s, so its fallback stays visible.
      </Text>
      <View style={styles.row}>
        <Avatar.Root style={styles.avatar}>
          <Avatar.Image
            source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
            style={styles.avatarImage}
          />
          <Avatar.Fallback style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>EB</Text>
          </Avatar.Fallback>
        </Avatar.Root>

        <Avatar.Root style={styles.avatar}>
          <Avatar.Image source={{ uri: 'https://example.com/missing.png' }} style={styles.avatarImage} />
          <Avatar.Fallback style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>404</Text>
          </Avatar.Fallback>
        </Avatar.Root>
      </View>
    </View>
  );
}

export function NumberFieldSection() {
  const [value, setValue] = React.useState<number | null>(2);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>NumberField</Text>
      <Text style={styles.label}>
        Drag the ✥ handle sideways to scrub the value, or hold a stepper to repeat.
      </Text>

      <NumberField.Root value={value} onValueChange={setValue} min={0} max={20} style={styles.group}>
        <View style={styles.row}>
          <NumberField.ScrubArea style={styles.scrubArea}>
            <Text style={styles.label}>✥</Text>
          </NumberField.ScrubArea>

          <NumberField.Group style={styles.numberFieldGroup}>
            <NumberField.Decrement
              style={(state) => [
                styles.stepper,
                state.pressed && styles.buttonPressed,
                state.disabled && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>−</Text>
            </NumberField.Decrement>
            <NumberField.Input style={styles.numberFieldInput} />
            <NumberField.Increment
              style={(state) => [
                styles.stepper,
                state.pressed && styles.buttonPressed,
                state.disabled && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>+</Text>
            </NumberField.Increment>
          </NumberField.Group>
        </View>
      </NumberField.Root>

      <Text style={styles.label}>Formatted as a currency:</Text>
      <NumberField.Root
        defaultValue={19.99}
        step={0.5}
        format={{ style: 'currency', currency: 'USD' }}
        locale="en-US"
      >
        <NumberField.Group style={styles.numberFieldGroup}>
          <NumberField.Decrement style={(state) => [styles.stepper, state.pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>−</Text>
          </NumberField.Decrement>
          <NumberField.Input style={styles.numberFieldInput} />
          <NumberField.Increment style={(state) => [styles.stepper, state.pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>+</Text>
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </View>
  );
}

export function OTPFieldSection() {
  const [completed, setCompleted] = React.useState<string | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>OTPField</Text>
      <Text style={styles.label}>
        The first slot advertises `one-time-code`, so the OS offers a code it read from an SMS —
        pasting or autofilling it spreads across every slot.
      </Text>
      {completed ? <Text style={styles.label}>Completed: {completed}</Text> : null}

      <OTPField.Root length={6} onValueComplete={setCompleted} style={styles.row}>
        {Array.from({ length: 6 }, (_, index) => (
          <OTPField.Input
            key={index}
            style={(state) => [styles.otpSlot, state.filled && styles.otpSlotFilled]}
          />
        ))}
      </OTPField.Root>
    </View>
  );
}

export function ToastSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Toast</Text>
      <Text style={styles.label}>
        Toasts are the one popup that is not a Modal: the app underneath has to stay usable. The
        Provider + Viewport live at the app root (see App above), so toasts appear pinned to the
        bottom of the screen no matter where you have scrolled. Swipe one right to dismiss it.
      </Text>

      <ToastButtons />
    </View>
  );
}

export function ToastButtons() {
  const { add, promise } = Toast.useToastManager();

  return (
    <View style={styles.row}>
      <Button
        onPress={() => add({ title: 'Saved', description: 'Your changes are safe.' })}
        style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Add toast</Text>
      </Button>
      <Button
        onPress={() =>
          promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: 'Saving…',
            success: 'Saved!',
            error: 'Failed to save',
          }).catch(() => {})
        }
        style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Promise</Text>
      </Button>
    </View>
  );
}

/**
 * The screen-anchored toast overlay. The Viewport fills the screen and lets
 * touches through (`pointerEvents="box-none"`); each toast pins itself to the
 * bottom edge and the stack grows upward. To make toasts drop from the TOP
 * instead, anchor `styles.toast` with `top: 0` and flip the `translateY` sign in
 * the Root's style — position and direction are entirely the consumer's, since
 * the library ships no styling.
 */
export function ToastOverlay() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport style={styles.toastViewport}>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          style={(state) => [
            styles.toast,
            state.type === 'error' && styles.toastError,
            state.limited && styles.toastLimited,
            {
              transform: [
                { translateY: -state.offsetY - state.visibleIndex * 8 },
                { translateX: Math.max(state.swipeMovement, 0) },
              ],
            },
          ]}
        >
          <Toast.Title style={styles.toastTitle} />
          <Toast.Description style={styles.toastDescription} />
          <Toast.Close style={(state) => [styles.toastClose, state.pressed && styles.buttonPressed]}>
            <Text style={styles.toastCloseText}>✕</Text>
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}
