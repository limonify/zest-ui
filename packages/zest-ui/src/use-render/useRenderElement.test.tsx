import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useRenderElement } from './useRenderElement';

interface TestComponentProps {
  className?: string | ((state: { active: boolean }) => string | undefined);
  style?: any;
  render?: any;
  active?: boolean;
  testID?: string;
  ref?: React.Ref<any>;
  children?: React.ReactNode;
  onPress?: () => void;
}

function TestComponent(props: TestComponentProps) {
  const { className, style, render: renderProp, active = false, ref, ...otherProps } = props;
  const state = React.useMemo(() => ({ active }), [active]);

  return useRenderElement(
    View,
    { className, style, render: renderProp },
    {
      state,
      ref,
      props: [{ collapsable: false, testID: 'default-id' }, otherProps],
    },
  );
}

describe('useRenderElement', () => {
  it('renders the default component with merged props', async () => {
    await render(
      <TestComponent testID="external-id">
        <Text>content</Text>
      </TestComponent>,
    );

    // External props overwrite internal ones.
    const view = screen.getByTestId('external-id');
    expect(view).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('resolves style functions against state and merges as arrays', async () => {
    await render(
      <TestComponent
        testID="styled"
        active
        style={(state: { active: boolean }) => ({ opacity: state.active ? 0.5 : 1 })}
      />,
    );

    const view = screen.getByTestId('styled');
    expect(StyleSheet.flatten(view.props.style)).toMatchObject({ opacity: 0.5 });
  });

  it('supports the render prop element form, cloning with merged props', async () => {
    await render(
      <TestComponent
        testID="outer"
        render={
          <View testID="custom-element">
            <Text>custom</Text>
          </View>
        }
      />,
    );

    // The custom element's own props win over the merged ones.
    expect(screen.getByTestId('custom-element')).toBeTruthy();
    expect(screen.getByText('custom')).toBeTruthy();
  });

  it('supports the render prop function form, receiving props and state', async () => {
    const renderFn = jest.fn((props: any, state: { active: boolean }) => (
      <View {...props}>
        <Text>{state.active ? 'on' : 'off'}</Text>
      </View>
    ));

    await render(<TestComponent active render={renderFn} />);

    expect(screen.getByText('on')).toBeTruthy();
    expect(renderFn).toHaveBeenCalledWith(
      expect.objectContaining({ testID: 'default-id' }),
      { active: true },
    );
  });

  it('merges the forwarded ref with the render element ref', async () => {
    const outerRef = React.createRef<View>();
    const innerRef = React.createRef<View>();

    await render(<TestComponent ref={outerRef} render={<View ref={innerRef} />} />);

    expect(outerRef.current).toBeTruthy();
    expect(innerRef.current).toBe(outerRef.current);
  });

  it('returns null when enabled is false', async () => {
    function Conditional({ enabled }: { enabled: boolean }) {
      const element = useRenderElement(View, {}, { enabled, props: { testID: 'maybe' } });
      return element;
    }

    await render(<Conditional enabled={false} />);
    expect(screen.queryByTestId('maybe')).toBeNull();

    await render(<Conditional enabled />);
    expect(screen.getByTestId('maybe')).toBeTruthy();
  });

  it('chains event handlers right-to-left across prop sets', async () => {
    const order: string[] = [];
    function Pressy() {
      return useRenderElement(
        View,
        {},
        {
          props: [
            { onTouchStart: () => order.push('internal') },
            { onTouchStart: () => order.push('external'), testID: 'pressy' },
          ],
        },
      );
    }

    await render(<Pressy />);
    const view = screen.getByTestId('pressy');
    view.props.onTouchStart({ nativeEvent: {} });

    expect(order).toEqual(['external', 'internal']);
  });
});
