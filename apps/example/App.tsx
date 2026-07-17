import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Separator, Toast } from '@limonify/zest-ui';
import { styles } from './styles';
import {
  AccordionSection,
  AlertDialogSection,
  AvatarSection,
  ButtonSection,
  CheckboxGroupSection,
  CheckboxSection,
  CollapsibleSection,
  ComboboxSection,
  ContextMenuSection,
  DialogSection,
  DrawerSection,
  FieldSection,
  HandleSection,
  MenuSection,
  MeterSection,
  MultiSelectSection,
  NumberFieldSection,
  OTPFieldSection,
  PopoverSection,
  ProgressSection,
  RadioSection,
  SelectSection,
  SliderSection,
  SwitchSection,
  TabsSection,
  ToastOverlay,
  ToastSection,
  ToggleSection,
  TooltipSection,
} from './sections';

export default function App() {
  return (
    // Slider and Drawer are built on react-native-gesture-handler, which needs
    // this at the root of the app.
    <GestureHandlerRootView style={styles.safeArea}>
      <SafeAreaProvider>
      {/*
        Toast is the one popup that is not a Modal, so its Provider goes at the
        very root of the app and its Viewport overlays the whole screen — that is
        what makes a toast appear at a fixed place regardless of scroll. The
        buttons that raise toasts live down in ToastSection, inside this Provider.
      */}
      <Toast.Provider timeout={4000} limit={3}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>@limonify/zest-ui</Text>
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
          <ContextMenuSection />
          <Separator style={styles.separator} />
          <FieldSection />
          <Separator style={styles.separator} />
          <ComboboxSection />
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
          <MeterSection />
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
