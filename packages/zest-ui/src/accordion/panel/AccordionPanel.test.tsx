import * as React from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Accordion } from '../index';

// A closed panel sets `accessibilityElementsHidden` / `importantForAccessibility`,
// and RNTL filters accessibility-hidden subtrees out of queries by default. These
// assertions are about what is *mounted*, so they opt back in.
const HIDDEN = { includeHiddenElements: true } as const;

/**
 * Stand-in for `Animated.View` from Reanimated or RN Animated: a wrapper the
 * consumer supplies through `render`, whose own style is composed with the
 * panel's. The panel must still deliver its children through it.
 */
function FakeAnimatedView(props: ViewProps) {
  return <View {...props} />;
}

function TestAccordion(props: {
  keepMounted?: boolean;
  animated?: boolean;
  defaultValue?: string[];
}) {
  const { keepMounted, animated, defaultValue } = props;

  return (
    <Accordion.Root defaultValue={defaultValue} keepMounted={keepMounted}>
      <Accordion.Item value="one">
        <Accordion.Header>
          <Accordion.Trigger testID="trigger">
            <Text>Section one</Text>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel
          testID="panel"
          render={
            animated
              ? (panelProps, state) => (
                  <FakeAnimatedView
                    {...panelProps}
                    style={[panelProps.style, { height: state.height ?? 0 }]}
                  />
                )
              : undefined
          }
        >
          <Text testID="content">Panel content</Text>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

describe('Accordion.Panel content rendering', () => {
  it('renders the content when open by default', async () => {
    await render(<TestAccordion defaultValue={['one']} />);

    expect(screen.getByTestId('content')).toBeTruthy();
    expect(screen.getByText('Panel content')).toBeTruthy();
  });

  it('renders the content after opening from closed', async () => {
    await render(<TestAccordion />);

    expect(screen.queryByTestId('content')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('unmounts the content on close, and brings it back on reopen', async () => {
    await render(<TestAccordion defaultValue={['one']} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();

    await user.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('keeps the content mounted while closed when keepMounted is set', async () => {
    await render(<TestAccordion keepMounted />);

    // Mounted but hidden from assistive technology.
    expect(screen.getByTestId('content', HIDDEN)).toBeTruthy();
    expect(screen.getByTestId('panel', HIDDEN).props.accessibilityElementsHidden).toBe(true);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('panel').props.accessibilityElementsHidden).toBe(false);
  });
});

describe('Accordion.Panel wrapped in an animated view', () => {
  it('delivers the children through a consumer-supplied wrapper', async () => {
    await render(<TestAccordion animated defaultValue={['one']} />);

    expect(screen.getByTestId('content')).toBeTruthy();
    expect(screen.getByText('Panel content')).toBeTruthy();
  });

  it('keeps the content mounted through a wrapper while closed with keepMounted', async () => {
    await render(<TestAccordion animated keepMounted />);

    expect(screen.getByTestId('content', HIDDEN)).toBeTruthy();
  });

  it('measures the natural content height even while the panel is clipped to zero', async () => {
    // This is the animation deadlock to guard against: the wrapper's height is
    // driven by `state.height`, which starts `undefined` (rendered as 0). If the
    // clip stopped the inner wrapper from being measured, height would stay 0
    // and the content would never become visible.
    await render(<TestAccordion animated keepMounted />);

    const panel = screen.getByTestId('panel', HIDDEN);
    expect(panel.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 0 })]),
    );

    const contentWrapper = screen.getByTestId('content', HIDDEN).parent!;
    await act(async () => {
      fireEvent(contentWrapper, 'layout', {
        nativeEvent: { layout: { height: 84, width: 300, x: 0, y: 0 } },
      });
    });

    expect(screen.getByTestId('panel', HIDDEN).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 84 })]),
    );
  });

  it('ignores a zero-height measurement but accepts the next real one', async () => {
    await render(<TestAccordion animated keepMounted />);

    const contentWrapper = screen.getByTestId('content', HIDDEN).parent!;

    await act(async () => {
      fireEvent(contentWrapper, 'layout', {
        nativeEvent: { layout: { height: 0, width: 300, x: 0, y: 0 } },
      });
    });
    expect(screen.getByTestId('panel', HIDDEN).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 0 })]),
    );

    await act(async () => {
      fireEvent(contentWrapper, 'layout', {
        nativeEvent: { layout: { height: 120, width: 300, x: 0, y: 0 } },
      });
    });
    expect(screen.getByTestId('panel', HIDDEN).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 120 })]),
    );
  });

  it('preserves the panel clip when the wrapper composes props.style', async () => {
    await render(<TestAccordion animated defaultValue={['one']} />);

    expect(screen.getByTestId('panel').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ overflow: 'hidden' })]),
    );
  });
});
