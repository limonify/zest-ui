'use client';

import { Text, View } from 'react-native';
import { Button, Toast } from '@limonify/zest-ui';
import { c, s } from './styles';

export function ToastDemo() {
  return (
    // Toast is the one popup that is not a Modal — the app underneath has to
    // stay usable — so its Provider goes at the root of whatever it overlays.
    <Toast.Provider timeout={4000} limit={3}>
      <View style={[s.stage, { minHeight: 180 }]}>
        <Buttons />
        <Overlay />
      </View>
    </Toast.Provider>
  );
}

function Buttons() {
  const { add, promise } = Toast.useToastManager();

  return (
    <View style={s.row}>
      <Button
        onPress={() => add({ title: 'Saved', description: 'Your changes are safe.' })}
        style={(state) => [s.button, state.pressed && s.buttonPressed]}
      >
        <Text style={s.buttonText}>Add toast</Text>
      </Button>
      <Button
        onPress={() =>
          promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: 'Saving…',
            success: 'Saved!',
            error: 'Failed to save',
          }).catch(() => {})
        }
        style={(state) => [s.button, state.pressed && s.buttonPressed]}
      >
        <Text style={s.buttonText}>Promise</Text>
      </Button>
    </View>
  );
}

function Overlay() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport
      style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          style={(state) => [
            s.popup,
            { maxWidth: undefined, gap: 2 },
            state.type === 'error' && { borderColor: c.danger },
            {
              transform: [
                { translateY: -state.offsetY - state.visibleIndex * 8 },
                { translateX: Math.max(state.swipeMovement, 0) },
              ],
            },
          ]}
        >
          <Toast.Title style={s.heading} />
          <Toast.Description style={s.muted} />
          <Toast.Close style={(state) => [{ position: 'absolute', top: 10, right: 12 }, state.pressed && s.buttonPressed]}>
            <Text style={s.muted}>✕</Text>
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}
