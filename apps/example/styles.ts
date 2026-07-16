import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  menuBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  contextArea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  comboboxPopup: {
    maxHeight: 240,
    marginTop: 4,
  },
  comboboxEmpty: {
    padding: 12,
  },
  fieldRoot: {
    gap: 6,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldControl: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  fieldControlFocused: {
    borderColor: '#007AFF',
  },
  fieldControlInvalid: {
    borderColor: '#FF3B30',
  },
  fieldDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fieldError: {
    fontSize: 12,
    color: '#FF3B30',
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
