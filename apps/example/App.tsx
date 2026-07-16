import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Accordion,
  AlertDialog,
  Avatar,
  Button,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  createDialogHandle,
  Dialog,
  Drawer,
  Menu,
  NumberField,
  OTPField,
  Popover,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  Toast,
  Toggle,
  ToggleGroup,
  Tooltip,
} from '@limonify/zest';

export default function App() {
  return (
    // Slider and Drawer are built on react-native-gesture-handler, which needs
    // this at the root of the app.
    <GestureHandlerRootView style={styles.safeArea}>
      {/*
        Toast is the one popup that is not a Modal, so its Provider goes at the
        very root of the app and its Viewport overlays the whole screen — that is
        what makes a toast appear at a fixed place regardless of scroll. The
        buttons that raise toasts live down in ToastSection, inside this Provider.
      */}
      <Toast.Provider timeout={4000} limit={3}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>@limonify/zest</Text>
          <Text style={styles.subheading}>
            Headless Base UI primitives for React Native. All styling below is plain StyleSheet,
            applied by the consumer.
          </Text>

          <ButtonSection />
          <Separator style={styles.separator} />
          <CheckboxSection />
          <Separator style={styles.separator} />
          <CheckboxGroupSection />
          <Separator style={styles.separator} />
          <SwitchSection />
          <Separator style={styles.separator} />
          <ToggleSection />
          <Separator style={styles.separator} />
          <RadioSection />
          <Separator style={styles.separator} />
          <TabsSection />
          <Separator style={styles.separator} />
          <CollapsibleSection />
          <Separator style={styles.separator} />
          <AccordionSection />
          <Separator style={styles.separator} />
          <DialogSection />
          <Separator style={styles.separator} />
          <AlertDialogSection />
          <Separator style={styles.separator} />
          <PopoverSection />
          <Separator style={styles.separator} />
          <TooltipSection />
          <Separator style={styles.separator} />
          <MenuSection />
          <Separator style={styles.separator} />
          <SelectSection />
          <Separator style={styles.separator} />
          <MultiSelectSection />
          <Separator style={styles.separator} />
          <HandleSection />
          <Separator style={styles.separator} />
          <SliderSection />
          <Separator style={styles.separator} />
          <DrawerSection />
          <Separator style={styles.separator} />
          <ProgressSection />
          <Separator style={styles.separator} />
          <AvatarSection />
          <Separator style={styles.separator} />
          <NumberFieldSection />
          <Separator style={styles.separator} />
          <OTPFieldSection />
          <Separator style={styles.separator} />
          <ToastSection />
        </ScrollView>
        <StatusBar style="auto" />
        {/* Screen-anchored overlay: sits above everything, lets touches through. */}
        <ToastOverlay />
        </SafeAreaView>
      </Toast.Provider>
    </GestureHandlerRootView>
  );
}

function ButtonSection() {
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

function CheckboxSection() {
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
 * Animates a collapsible/accordion panel from the state zest publishes.
 *
 * This is the whole React Native animation contract: the panel measures its
 * natural content and hands back `height` + `transitionStatus`; the consumer
 * owns the animation. `keepMounted` is what makes the closing animation
 * possible — an unmounted panel would simply vanish.
 */
function useAnimatedPanelStyle(open: boolean, height: number | undefined) {
  const progress = React.useRef(new Animated.Value(open ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 200,
      // Height isn't supported by the native driver.
      useNativeDriver: false,
    }).start();
  }, [open, progress]);

  return {
    height:
      height === undefined
        ? undefined
        : progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
    opacity: progress,
  };
}

/**
 * Swaps the panel's element for an `Animated.View` and drives it from the state
 * zest publishes. Used via the `render` prop by both Collapsible and Accordion.
 */
function AnimatedPanel(props: {
  open: boolean;
  height: number | undefined;
  style?: unknown;
  children?: React.ReactNode;
}) {
  const { open, height, style, ...rest } = props;
  const animatedStyle = useAnimatedPanelStyle(open, height);

  return <Animated.View {...rest} style={[style as never, animatedStyle]} />;
}

/**
 * Slides the tab indicator to the active tab. The indicator publishes the active
 * tab's measured position and size on its state — the counterpart of the web
 * version's `--active-tab-*` CSS variables — and the consumer animates it.
 */
function TabsIndicatorBar(props: {
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

function TabsSection() {
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

function CollapsibleSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Collapsible</Text>
      <Collapsible.Root defaultOpen style={styles.group}>
        <Collapsible.Trigger
          style={(state) => [styles.button, state.pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Toggle details</Text>
        </Collapsible.Trigger>
        <Collapsible.Panel
          keepMounted
          render={(props, state) => (
            <AnimatedPanel {...props} open={state.open} height={state.height} />
          )}
        >
          <View style={styles.panelBody}>
            <Text style={styles.label}>
              The panel measures its own content and publishes the height on its state; this
              example animates it with RN's built-in Animated. No animation library involved.
            </Text>
          </View>
        </Collapsible.Panel>
      </Collapsible.Root>
    </View>
  );
}

function AccordionSection() {
  const items = [
    { value: 'shipping', title: 'Shipping', body: 'Ships in 2–4 business days.' },
    { value: 'returns', title: 'Returns', body: 'Free returns within 30 days of delivery.' },
    { value: 'support', title: 'Support', body: 'Reach us any weekday between 9:00 and 18:00.' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Accordion</Text>
      <Accordion.Root keepMounted defaultValue={['shipping']} style={styles.group}>
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
            <Accordion.Panel
              render={(props, state) => (
                <AnimatedPanel {...props} open={state.open} height={state.height} />
              )}
            >
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

const COLORS = ['red', 'green', 'blue'];

function CheckboxGroupSection() {
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

function SwitchSection() {
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

function ToggleSection() {
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

function RadioSection() {
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

function AlertDialogSection() {
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

function DialogSection() {
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

function PopoverSection() {
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

function TooltipSection() {
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

function MenuSection() {
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
          <Menu.Backdrop style={styles.transparentBackdrop} />
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

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

function SelectSection() {
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

function MultiSelectSection() {
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
const confirmDialog = createDialogHandle<{ file: string }>();

function HandleSection() {
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

function SliderSection() {
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

function DrawerSection() {
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

function ProgressSection() {
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

function AvatarSection() {
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

function NumberFieldSection() {
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

function OTPFieldSection() {
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

function ToastSection() {
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

function ToastButtons() {
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
function ToastOverlay() {
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  group: {
    gap: 12,
  },
  indented: {
    marginLeft: 24,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    backgroundColor: '#0056CC',
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  switchTrack: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    backgroundColor: '#e5e5ea',
    justifyContent: 'center',
  },
  switchTrackChecked: {
    backgroundColor: '#34C759',
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  switchThumbChecked: {
    alignSelf: 'flex-end',
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignSelf: 'flex-start',
  },
  togglePressed: {
    backgroundColor: '#D6E9FF',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  panelBody: {
    paddingVertical: 12,
  },
  tabsList: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabsIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#007AFF',
  },
  accordionItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  accordionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  viewport: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  transparentBackdrop: {
    backgroundColor: 'transparent',
  },
  floatingPopup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    minWidth: 200,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  arrow: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  tooltipPopup: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tooltipArrow: {
    width: 8,
    height: 8,
    backgroundColor: '#111',
    transform: [{ rotate: '45deg' }],
  },
  tooltipText: {
    color: '#fff',
    fontSize: 13,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: '#EEF4FF',
  },
  menuItemSelected: {
    backgroundColor: '#EEF4FF',
  },
  dangerText: {
    color: '#FF3B30',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    alignSelf: 'flex-start',
    minWidth: 180,
  },
  selectLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  selectArrow: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    transform: [{ rotate: '45deg' }],
    marginBottom: -6,
  },
  sliderControl: {
    height: 44,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
  },
  sliderIndicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    // Pull the thumb back by half its width so its centre sits on the value.
    marginLeft: -12,
    top: -10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sliderThumbActive: {
    transform: [{ scale: 1.15 }],
  },
  drawerViewport: {
    justifyContent: 'flex-end',
  },
  drawerPopup: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48,
    gap: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 8,
  },
  drawerSwipeArea: {
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    backgroundColor: '#F2F2F7',
    marginTop: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  progressIndicatorComplete: {
    backgroundColor: '#34C759',
  },
  progressIndicatorIndeterminate: {
    height: '100%',
    width: '40%',
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1D1D6',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  scrubArea: {
    padding: 12,
  },
  numberFieldGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  stepper: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  numberFieldInput: {
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
  },
  otpSlot: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
  },
  otpSlotFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#EEF4FF',
  },
  toastViewport: {
    // The viewport already fills the screen (absoluteFill) and lets touches
    // through; only the toasts themselves are interactive. Padding keeps them
    // clear of the screen edges and the home indicator.
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  toast: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    paddingRight: 44,
    gap: 4,
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 48,
  },
  toastError: {
    backgroundColor: '#FF3B30',
  },
  toastLimited: {
    opacity: 0,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  toastDescription: {
    color: '#EBEBF5',
    fontSize: 13,
  },
  toastClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
  },
  toastCloseText: {
    color: '#fff',
    fontSize: 14,
  },
  dialogDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
