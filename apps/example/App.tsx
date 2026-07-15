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
  Button,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  Dialog,
  Drawer,
  Menu,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  Toggle,
  ToggleGroup,
  Tooltip,
} from '@limonify/zest';

export default function App() {
  return (
    // Slider and Drawer are built on react-native-gesture-handler, which needs
    // this at the root of the app.
    <GestureHandlerRootView style={styles.safeArea}>
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
          <SliderSection />
          <Separator style={styles.separator} />
          <DrawerSection />
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
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
      <Collapsible.Root style={styles.group}>
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
      <Accordion.Root keepMounted style={styles.group}>
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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Menu</Text>
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

function SliderSection() {
  const [range, setRange] = React.useState<readonly number[]>([20, 60]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Slider</Text>

      <Slider.Root defaultValue={40} style={styles.group}>
        <Slider.Value style={styles.label} />
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
  dialogDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
