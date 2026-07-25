import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Checkbox, Field, Fieldset, Input } from '../../index';

describe('Fieldset', () => {
  it('renders as a group', async () => {
    await render(
      <Fieldset.Root testID="fieldset">
        <Text>Contents</Text>
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('fieldset').props.role).toBe('group');
  });

  it('is labelled by its legend', async () => {
    await render(
      <Fieldset.Root testID="fieldset">
        <Fieldset.Legend testID="legend">Shipping address</Fieldset.Legend>
      </Fieldset.Root>,
    );

    const legendId = screen.getByTestId('legend').props.nativeID;

    expect(legendId).toBeTruthy();
    expect(screen.getByTestId('fieldset').props.accessibilityLabelledBy).toBe(legendId);
    expect(screen.getByTestId('fieldset').props['aria-labelledby']).toBe(legendId);
  });

  it('announces the legend as a heading', async () => {
    await render(
      <Fieldset.Root>
        <Fieldset.Legend testID="legend">Shipping address</Fieldset.Legend>
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('legend').props.role).toBe('heading');
  });

  it('drops the label association when the legend unmounts', async () => {
    const view = await render(
      <Fieldset.Root testID="fieldset">
        <Fieldset.Legend testID="legend">Shipping address</Fieldset.Legend>
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('fieldset').props.accessibilityLabelledBy).toBeTruthy();

    await view.rerender(<Fieldset.Root testID="fieldset" />);

    expect(screen.getByTestId('fieldset').props.accessibilityLabelledBy).toBeUndefined();
  });

  it('publishes disabled to its own parts through a style function', async () => {
    const seen: boolean[] = [];

    await render(
      <Fieldset.Root disabled>
        <Fieldset.Legend
          testID="legend"
          style={(state) => {
            seen.push(state.disabled);
            return undefined;
          }}
        >
          Shipping address
        </Fieldset.Legend>
      </Fieldset.Root>,
    );

    expect(seen.at(-1)).toBe(true);
  });

  it('disables every field inside it', async () => {
    await render(
      <Fieldset.Root disabled>
        <Field.Root>
          <Input testID="input" />
        </Field.Root>
        <Field.Root>
          <Checkbox.Root testID="checkbox" />
        </Field.Root>
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('input').props.editable).toBe(false);
    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('leaves fields alone when it is not disabled', async () => {
    const onCheckedChange = jest.fn();

    await render(
      <Fieldset.Root>
        <Field.Root>
          <Checkbox.Root testID="checkbox" onCheckedChange={onCheckedChange} />
        </Field.Root>
      </Fieldset.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
