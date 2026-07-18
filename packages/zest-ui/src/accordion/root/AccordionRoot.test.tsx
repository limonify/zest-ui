import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Accordion } from '../index';

function TestAccordion(props: React.ComponentProps<typeof Accordion.Root>) {
  return (
    <Accordion.Root testID="root" {...props}>
      {['one', 'two'].map((item) => (
        <Accordion.Item key={item} testID={`item-${item}`} value={item}>
          <Accordion.Header testID={`header-${item}`}>
            <Accordion.Trigger testID={`trigger-${item}`}>
              <Text>Trigger {item}</Text>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel testID={`panel-${item}`}>
            <Text>Panel {item}</Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

describe('Accordion', () => {
  it('opens one item at a time by default', async () => {
    const onValueChange = jest.fn();
    await render(<TestAccordion defaultValue={['one']} onValueChange={onValueChange} />);

    expect(screen.getByTestId('panel-one')).toBeTruthy();
    expect(screen.queryByTestId('panel-two')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-two'));

    expect(onValueChange).toHaveBeenCalledWith(
      ['two'],
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    // Opening the second item closes the first.
    expect(screen.queryByTestId('panel-one')).toBeNull();
    expect(screen.getByTestId('panel-two')).toBeTruthy();
  });

  it('closes an open item when its own trigger is pressed', async () => {
    const onValueChange = jest.fn();
    await render(<TestAccordion defaultValue={['one']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-one'));

    expect(onValueChange).toHaveBeenCalledWith([], expect.anything());
    expect(screen.queryByTestId('panel-one')).toBeNull();
  });

  it('keeps multiple items open when multiple is set', async () => {
    const onValueChange = jest.fn();
    await render(<TestAccordion multiple defaultValue={['one']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-two'));

    expect(onValueChange).toHaveBeenCalledWith(['one', 'two'], expect.anything());
    expect(screen.getByTestId('panel-one')).toBeTruthy();
    expect(screen.getByTestId('panel-two')).toBeTruthy();
  });

  it('removes only the pressed item in multiple mode', async () => {
    const onValueChange = jest.fn();
    await render(
      <TestAccordion multiple defaultValue={['one', 'two']} onValueChange={onValueChange} />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-one'));

    expect(onValueChange).toHaveBeenCalledWith(['two'], expect.anything());
    expect(screen.queryByTestId('panel-one')).toBeNull();
    expect(screen.getByTestId('panel-two')).toBeTruthy();
  });

  it('respects the controlled value prop', async () => {
    const onValueChange = jest.fn();
    await render(<TestAccordion value={['one']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-two'));

    expect(onValueChange).toHaveBeenCalledWith(['two'], expect.anything());
    // Controlled: nothing moves until the owner flips the prop.
    expect(screen.getByTestId('panel-one')).toBeTruthy();
    expect(screen.queryByTestId('panel-two')).toBeNull();
  });

  it('cancels the change when eventDetails.cancel() is called', async () => {
    await render(
      <TestAccordion
        onValueChange={(value, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-one'));

    expect(screen.queryByTestId('panel-one')).toBeNull();
  });

  it('lets an Item veto its own change via onOpenChange', async () => {
    const onValueChange = jest.fn();
    await render(
      <Accordion.Root onValueChange={onValueChange}>
        <Accordion.Item
          value="one"
          onOpenChange={(open, eventDetails) => {
            eventDetails.cancel();
          }}
        >
          <Accordion.Trigger testID="trigger-one">
            <Text>Trigger one</Text>
          </Accordion.Trigger>
          <Accordion.Panel testID="panel-one">
            <Text>Panel one</Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-one'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('panel-one')).toBeNull();
  });

  it('propagates disabled from the root to its triggers', async () => {
    const onValueChange = jest.fn();
    await render(<TestAccordion disabled onValueChange={onValueChange} />);

    expect(screen.getByTestId('trigger-one').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-one'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('supports disabling a single item', async () => {
    const onValueChange = jest.fn();
    await render(
      <Accordion.Root onValueChange={onValueChange}>
        <Accordion.Item value="one" disabled>
          <Accordion.Trigger testID="trigger-one">
            <Text>Trigger one</Text>
          </Accordion.Trigger>
          <Accordion.Panel testID="panel-one">
            <Text>Panel one</Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger-one'));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('wires accordion accessibility semantics', async () => {
    await render(<TestAccordion defaultValue={['one']} />);

    const header = screen.getByTestId('header-one');
    const trigger = screen.getByTestId('trigger-one');
    const panel = screen.getByTestId('panel-one');

    expect(header.props.accessibilityRole).toBe('header');
    expect(trigger.props.accessibilityState).toMatchObject({ expanded: true });
    expect(panel.props.role).toBe('region');
    // The panel is labelled by its trigger, and the trigger controls the panel.
    expect(trigger.props.nativeID).toBeTruthy();
    expect(panel.props.accessibilityLabelledBy).toBe(trigger.props.nativeID);
    expect(trigger.props['aria-controls']).toBe(panel.props.nativeID);
  });

  it('generates a fallback value when an Item has none', async () => {
    const onValueChange = jest.fn();
    await render(
      <Accordion.Root onValueChange={onValueChange}>
        <Accordion.Item>
          <Accordion.Trigger testID="trigger">
            <Text>Trigger</Text>
          </Accordion.Trigger>
          <Accordion.Panel testID="panel">
            <Text>Panel</Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onValueChange).toHaveBeenCalledWith([expect.any(String)], expect.anything());
    expect(screen.getByTestId('panel')).toBeTruthy();
  });

  it('keeps panels rendered when keepMounted is set on the root', async () => {
    await render(<TestAccordion keepMounted />);

    // Closed but rendered, and hidden from the accessibility tree.
    expect(screen.queryByTestId('panel-one')).toBeNull();
    expect(
      screen.getByTestId('panel-one', { includeHiddenElements: true }).props
        .accessibilityElementsHidden,
    ).toBe(true);
  });
});
