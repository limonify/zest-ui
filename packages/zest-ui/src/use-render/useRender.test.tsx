import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useRender } from './useRender';

/**
 * `useRender` is the public façade over the render engine — what a consumer uses
 * to give a component of their own the same `render`/`className`/`style`
 * contract every zest part has. `useRenderElement` is covered separately; this
 * asserts the façade's own defaults.
 */

type BadgeState = { tone: string };

function Badge(props: {
  tone?: string;
  render?: any;
  className?: any;
  style?: any;
  children?: React.ReactNode;
  testID?: string;
}) {
  const { tone = 'neutral', render: renderProp, className, style, ...elementProps } = props;
  const state: BadgeState = { tone };

  return useRender({
    render: renderProp,
    className,
    style,
    state,
    props: [{ accessibilityRole: 'text' as const }, elementProps],
  });
}

describe('useRender', () => {
  it('renders a View by default', async () => {
    await render(<Badge testID="badge" />);

    const badge = screen.getByTestId('badge');

    expect(badge).toBeTruthy();
    expect(badge.props.accessibilityRole).toBe('text');
  });

  it('honours an explicit defaultComponent', async () => {
    function TextBadge() {
      return useRender({
        defaultComponent: Text,
        state: {},
        props: { testID: 'text-badge', children: 'hi' },
      });
    }

    await render(<TextBadge />);

    expect(screen.getByTestId('text-badge')).toHaveTextContent('hi');
  });

  it('resolves style as a function of state', async () => {
    await render(
      <Badge testID="badge" tone="danger" style={(state: BadgeState) => ({ opacity: state.tone === 'danger' ? 1 : 0.5 })} />,
    );

    // No internal style to compose with, so `mergeStyles` hands the resolved
    // style straight through rather than wrapping it in an array.
    expect(screen.getByTestId('badge').props.style).toEqual({ opacity: 1 });
  });

  it('composes the consumer style after the component\'s own', async () => {
    function StyledBadge(props: { style?: any; testID?: string }) {
      return useRender({
        state: {},
        style: props.style,
        props: [{ style: { padding: 4 } }, { testID: props.testID }],
      });
    }

    await render(<StyledBadge testID="badge" style={{ padding: 12 }} />);

    // RN flattens left-to-right, so the consumer's padding wins.
    expect(screen.getByTestId('badge').props.style).toEqual([{ padding: 4 }, { padding: 12 }]);
  });

  it('replaces the element through a render function, passing state', async () => {
    const seen: BadgeState[] = [];

    await render(
      <Badge
        tone="danger"
        render={(props: any, state: BadgeState) => {
          seen.push(state);
          return <Pressable {...props} testID="pressable-badge" />;
        }}
      />,
    );

    expect(screen.getByTestId('pressable-badge')).toBeTruthy();
    expect(seen[0]).toEqual({ tone: 'danger' });
  });

  it('accepts an element for render and merges props into it', async () => {
    await render(<Badge testID="badge" render={<View accessibilityLabel="custom" />} />);

    const badge = screen.getByTestId('badge');

    expect(badge.props.accessibilityLabel).toBe('custom');
    expect(badge.props.accessibilityRole).toBe('text');
  });

  it('renders nothing when disabled', async () => {
    function Hidden() {
      return useRender({ enabled: false, state: {}, props: { testID: 'hidden' } });
    }

    await render(
      <View testID="wrapper">
        <Hidden />
      </View>,
    );

    expect(screen.queryByTestId('hidden')).toBeNull();
    expect(screen.getByTestId('wrapper')).toBeTruthy();
  });
});
