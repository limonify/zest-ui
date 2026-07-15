import * as React from 'react';
import { Text, type LayoutRectangle } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Tabs } from '../index';

function TestTabs(
  props: React.ComponentProps<typeof Tabs.Root> & { disabledTabs?: string[] },
) {
  const { disabledTabs = [], ...rootProps } = props;

  return (
    <Tabs.Root testID="root" {...rootProps}>
      <Tabs.List testID="list">
        {['a', 'b', 'c'].map((value) => (
          <Tabs.Tab key={value} testID={`tab-${value}`} value={value} disabled={disabledTabs.includes(value)}>
            <Text>{`Tab ${value}`}</Text>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {['a', 'b', 'c'].map((value) => (
        <Tabs.Panel key={value} testID={`panel-${value}`} value={value}>
          <Text>{`Panel ${value}`}</Text>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

async function layoutTab(value: string, rect: Partial<LayoutRectangle>) {
  await act(async () => {
    fireEvent(screen.getByTestId(`tab-${value}`), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 50, height: 20, ...rect } },
    });
  });
}

describe('Tabs', () => {
  it('selects the first enabled tab and reports the initial reason when defaultValue is omitted', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs onValueChange={onValueChange} />);

    // The implicit defaultValue of 0 matches no tab, so the root resolves it.
    expect(onValueChange).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ reason: 'initial', activationDirection: 'none' }),
    );
    expect(screen.getByTestId('panel-a')).toBeTruthy();
    expect(screen.queryByTestId('panel-b')).toBeNull();
  });

  it('skips a disabled first tab when resolving the initial selection', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs disabledTabs={['a']} onValueChange={onValueChange} />);

    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'initial' }));
    expect(screen.getByTestId('panel-b')).toBeTruthy();
  });

  it('switches tabs on press with the none reason', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs defaultValue="a" onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-b'));

    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('panel-b')).toBeTruthy();
    expect(screen.queryByTestId('panel-a')).toBeNull();
  });

  it('ignores presses on a disabled tab and on the active tab', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs defaultValue="a" disabledTabs={['b']} onValueChange={onValueChange} />);
    onValueChange.mockClear();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-b'));
    expect(onValueChange).not.toHaveBeenCalled();

    await user.press(screen.getByTestId('tab-a'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('cancels a user-initiated change when eventDetails.cancel() is called', async () => {
    await render(
      <TestTabs
        defaultValue="a"
        onValueChange={(value, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-b'));

    expect(screen.getByTestId('panel-a')).toBeTruthy();
    expect(screen.queryByTestId('panel-b')).toBeNull();
  });

  it('respects the controlled value prop', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs value="a" onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-b'));

    expect(onValueChange).toHaveBeenCalledWith('b', expect.anything());
    expect(screen.getByTestId('panel-a')).toBeTruthy();
  });

  it('keeps a disabled selection in a controlled root instead of falling back', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs value="b" disabledTabs={['b']} onValueChange={onValueChange} />);

    // Controlled roots keep exactly what the parent supplied.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('panel-b')).toBeTruthy();
  });

  it('honors an explicit defaultValue pointing at a disabled tab', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs defaultValue="b" disabledTabs={['b']} onValueChange={onValueChange} />);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('panel-b')).toBeTruthy();
  });

  it('falls back with the disabled reason when the selected tab becomes disabled', async () => {
    const onValueChange = jest.fn();
    const view = await render(<TestTabs defaultValue="b" onValueChange={onValueChange} />);
    onValueChange.mockClear();

    await view.rerender(<TestTabs defaultValue="b" disabledTabs={['b']} onValueChange={onValueChange} />);

    expect(onValueChange).toHaveBeenCalledWith('a', expect.objectContaining({ reason: 'disabled' }));
    expect(screen.getByTestId('panel-a')).toBeTruthy();
  });

  it('falls back with the missing reason when the selected tab is removed', async () => {
    const onValueChange = jest.fn();

    function Tabbed({ values }: { values: string[] }) {
      return (
        <Tabs.Root defaultValue="c" onValueChange={onValueChange}>
          <Tabs.List>
            {values.map((value) => (
              <Tabs.Tab key={value} testID={`tab-${value}`} value={value}>
                <Text>{`Tab ${value}`}</Text>
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {values.map((value) => (
            <Tabs.Panel key={value} testID={`panel-${value}`} value={value}>
              <Text>{`Panel ${value}`}</Text>
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      );
    }

    const view = await render(<Tabbed values={['a', 'b', 'c']} />);
    expect(screen.getByTestId('panel-c')).toBeTruthy();
    onValueChange.mockClear();

    await view.rerender(<Tabbed values={['a', 'b']} />);

    expect(onValueChange).toHaveBeenCalledWith('a', expect.objectContaining({ reason: 'missing' }));
  });

  it('falls back to null when no enabled tab is available', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs disabledTabs={['a', 'b', 'c']} onValueChange={onValueChange} />);

    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'initial' }));
    expect(screen.queryByTestId('panel-a')).toBeNull();
  });

  it('cannot cancel an automatic change', async () => {
    await render(
      <TestTabs
        onValueChange={(value, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    // The fallback is committed before the consumer is notified.
    expect(screen.getByTestId('panel-a')).toBeTruthy();
  });

  it('reports the activation direction from the tabs visual order', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs defaultValue="a" onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-c'));
    expect(onValueChange).toHaveBeenLastCalledWith('c', expect.objectContaining({ activationDirection: 'right' }));
  });

  it('derives the activation direction from measured order, not registration order', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs defaultValue="a" onValueChange={onValueChange} />);

    // Lay the tabs out right-to-left, as `flexDirection: 'row-reverse'` would.
    await layoutTab('a', { x: 200 });
    await layoutTab('b', { x: 100 });
    await layoutTab('c', { x: 0 });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-c'));

    // 'c' is visually left of 'a', so moving to it goes left.
    expect(onValueChange).toHaveBeenLastCalledWith('c', expect.objectContaining({ activationDirection: 'left' }));
  });

  it('reports up/down for a vertical orientation', async () => {
    const onValueChange = jest.fn();
    await render(<TestTabs orientation="vertical" defaultValue="c" onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-a'));

    expect(onValueChange).toHaveBeenLastCalledWith('a', expect.objectContaining({ activationDirection: 'up' }));
  });

  it('wires tab and panel accessibility semantics together', async () => {
    await render(<TestTabs defaultValue="a" />);

    const list = screen.getByTestId('list');
    const tab = screen.getByTestId('tab-a');
    const panel = screen.getByTestId('panel-a');

    expect(list.props.accessibilityRole).toBe('tablist');
    expect(tab.props.accessibilityRole).toBe('tab');
    expect(tab.props.accessibilityState).toMatchObject({ selected: true });
    expect(panel.props.role).toBe('tabpanel');
    expect(tab.props.nativeID).toBeTruthy();
    expect(panel.props.nativeID).toBeTruthy();
    expect(tab.props['aria-controls']).toBe(panel.props.nativeID);
    expect(panel.props.accessibilityLabelledBy).toBe(tab.props.nativeID);
  });

  it('keeps unselected panels rendered but hidden when keepMounted is set', async () => {
    await render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab testID="tab-a" value="a">
            <Text>Tab a</Text>
          </Tabs.Tab>
          <Tabs.Tab testID="tab-b" value="b">
            <Text>Tab b</Text>
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel testID="panel-b" value="b" keepMounted>
          <Text>Panel b</Text>
        </Tabs.Panel>
      </Tabs.Root>,
    );

    expect(screen.queryByTestId('panel-b')).toBeNull();
    expect(
      screen.getByTestId('panel-b', { includeHiddenElements: true }).props.accessibilityElementsHidden,
    ).toBe(true);
  });
});

describe('Tabs.Indicator', () => {
  function TestIndicator(props: { onStyle: (state: any) => void }) {
    return (
      <Tabs.Root defaultValue="a">
        <Tabs.List testID="list">
          <Tabs.Tab testID="tab-a" value="a">
            <Text>Tab a</Text>
          </Tabs.Tab>
          <Tabs.Tab testID="tab-b" value="b">
            <Text>Tab b</Text>
          </Tabs.Tab>
          <Tabs.Indicator
            testID="indicator"
            style={(state) => {
              props.onStyle(state);
              return {};
            }}
          />
        </Tabs.List>
      </Tabs.Root>
    );
  }

  it('renders nothing until the active tab has been measured', async () => {
    await render(<TestIndicator onStyle={() => {}} />);
    // The indicator is decorative and hidden from the accessibility tree, so it
    // has to be queried explicitly even once it renders.
    expect(screen.queryByTestId('indicator', { includeHiddenElements: true })).toBeNull();
  });

  it('publishes the active tab position and size once measured', async () => {
    const onStyle = jest.fn();
    await render(<TestIndicator onStyle={onStyle} />);

    await act(async () => {
      fireEvent(screen.getByTestId('list'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
      });
    });
    await layoutTab('a', { x: 0, y: 0, width: 80, height: 40 });
    await layoutTab('b', { x: 80, y: 0, width: 80, height: 40 });

    expect(screen.getByTestId('indicator', { includeHiddenElements: true })).toBeTruthy();
    expect(onStyle).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedTabPosition: { left: 0, top: 0, right: 120, bottom: 0 },
        selectedTabSize: { width: 80, height: 40 },
      }),
    );
  });

  it('follows the selection to the next tab', async () => {
    const onStyle = jest.fn();
    await render(<TestIndicator onStyle={onStyle} />);

    await act(async () => {
      fireEvent(screen.getByTestId('list'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
      });
    });
    await layoutTab('a', { x: 0, y: 0, width: 80, height: 40 });
    await layoutTab('b', { x: 80, y: 0, width: 80, height: 40 });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('tab-b'));

    expect(onStyle).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedTabPosition: { left: 80, top: 0, right: 40, bottom: 0 },
        selectedTabSize: { width: 80, height: 40 },
      }),
    );
  });
});
