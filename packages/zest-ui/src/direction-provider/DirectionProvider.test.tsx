import * as React from 'react';
import { I18nManager, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DirectionProvider, Popover, Slider, useDirection } from '../index';

const CONTROL_SIZE = 100;

function ReadDirection() {
  const direction = useDirection();
  return <Text testID="direction">{direction}</Text>;
}

function TestSlider(props: React.ComponentProps<typeof Slider.Root>) {
  return (
    <GestureHandlerRootView>
      <Slider.Root {...props}>
        <Slider.Control testID="control">
          <Slider.Track>
            <Slider.Thumb testID="thumb-0" index={0} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </GestureHandlerRootView>
  );
}

async function layoutControl() {
  await act(async () => {
    fireEvent(screen.getByTestId('control'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: CONTROL_SIZE, height: CONTROL_SIZE } },
    });
  });
}

async function drag(position: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('control'), [
      { state: State.BEGAN, x: position, y: position },
      { state: State.ACTIVE, x: position, y: position },
      { state: State.END, x: position, y: position },
    ]);
  });
}

describe('useDirection', () => {
  afterEach(() => {
    I18nManager.isRTL = false;
  });

  it('follows I18nManager when nothing overrides it', async () => {
    await render(<ReadDirection />);
    expect(screen.getByTestId('direction')).toHaveTextContent('ltr');

    I18nManager.isRTL = true;
    await render(<ReadDirection />);
    expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
  });

  it('takes the nearest provider over the platform', async () => {
    I18nManager.isRTL = true;

    await render(
      <DirectionProvider direction="ltr">
        <ReadDirection />
      </DirectionProvider>,
    );

    expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
  });

  it('nests', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <DirectionProvider direction="ltr">
          <ReadDirection />
        </DirectionProvider>
      </DirectionProvider>,
    );

    expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
  });
});

describe('Slider under RTL', () => {
  it('grows the value right to left', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <TestSlider defaultValue={0} />
      </DirectionProvider>,
    );
    await layoutControl();

    // A touch 30% from the control's leading edge is 70 on an RTL track.
    await drag(CONTROL_SIZE * 0.3);

    expect(screen.getByTestId('thumb-0').props.accessibilityValue.now).toBe(70);
  });

  it('keeps growing left to right under LTR', async () => {
    await render(
      <DirectionProvider direction="ltr">
        <TestSlider defaultValue={0} />
      </DirectionProvider>,
    );
    await layoutControl();

    await drag(CONTROL_SIZE * 0.3);

    expect(screen.getByTestId('thumb-0').props.accessibilityValue.now).toBe(30);
  });

  it('publishes the direction on state so the thumb can be mirrored', async () => {
    const styleFn = jest.fn(() => ({}));

    await render(
      <GestureHandlerRootView>
        <DirectionProvider direction="rtl">
          <Slider.Root defaultValue={20} style={styleFn}>
            <Slider.Control testID="control" />
          </Slider.Root>
        </DirectionProvider>
      </GestureHandlerRootView>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ direction: 'rtl' }));
  });

  it('leaves a vertical slider alone', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <TestSlider defaultValue={0} orientation="vertical" />
      </DirectionProvider>,
    );
    await layoutControl();

    // Vertical already inverts its axis; RTL must not invert it a second time.
    await drag(CONTROL_SIZE * 0.3);

    expect(screen.getByTestId('thumb-0').props.accessibilityValue.now).toBe(70);
  });
});

describe('Anchored popups under RTL', () => {
  it('reports the alignment in the vocabulary the consumer used', async () => {
    const styleFn = jest.fn(() => ({}));

    await render(
      <DirectionProvider direction="rtl">
        <Popover.Root defaultOpen>
          <Popover.Trigger testID="trigger">
            <Text>Open</Text>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" style={styleFn}>
              <Popover.Popup testID="popup">
                <Text>Content</Text>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </DirectionProvider>,
    );

    // `start` is mirrored to the right edge internally, but the state still says
    // `start` — the consumer never asked in physical terms.
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ align: 'start' }));
  });

  it('leaves a side-anchored popup alignment axis alone', async () => {
    const styleFn = jest.fn(() => ({}));

    await render(
      <DirectionProvider direction="rtl">
        <Popover.Root defaultOpen>
          <Popover.Trigger testID="trigger">
            <Text>Open</Text>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="right" align="start" style={styleFn}>
              <Popover.Popup testID="popup">
                <Text>Content</Text>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </DirectionProvider>,
    );

    // With the popup beside its anchor, `start`/`end` run vertically, which RTL
    // does not touch.
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ align: 'start' }));
  });
});

describe('logical sides', () => {
  function positioned(side: 'inline-start' | 'inline-end', direction: 'ltr' | 'rtl') {
    const styleFn = jest.fn(() => undefined);
    return {
      styleFn,
      element: (
        <DirectionProvider direction={direction}>
          <Popover.Root defaultOpen>
            <Popover.Trigger testID="trigger">
              <Text>Open</Text>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side={side} style={styleFn}>
                <Popover.Popup testID="popup">
                  <Text>Content</Text>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </DirectionProvider>
      ),
    };
  }

  it('resolves inline-start to left under LTR', async () => {
    const { styleFn, element } = positioned('inline-start', 'ltr');
    await render(element);
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ side: 'left' }));
  });

  it('resolves inline-start to right under RTL', async () => {
    const { styleFn, element } = positioned('inline-start', 'rtl');
    await render(element);
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ side: 'right' }));
  });

  it('resolves inline-end the other way round', async () => {
    const ltr = positioned('inline-end', 'ltr');
    await render(ltr.element);
    expect(ltr.styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ side: 'right' }));

    const rtl = positioned('inline-end', 'rtl');
    await render(rtl.element);
    expect(rtl.styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ side: 'left' }));
  });

  it('reports a physical side, so styling never sees a logical one', async () => {
    const { styleFn, element } = positioned('inline-start', 'rtl');
    await render(element);
    expect(styleFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ side: expect.stringMatching(/^(top|right|bottom|left)$/) }),
    );
  });
});
