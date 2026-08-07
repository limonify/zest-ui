import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Combobox } from '../../index';

/**
 * Which element the popup is positioned against.
 *
 * `Combobox.Trigger` and `Combobox.Input` both used to write the same
 * `triggerNode` slot from their ref callback, and in the trigger shape the
 * input is *inside the popup* and mounts second — so it won. The popup was then
 * anchored to an element it contains, which put it somewhere arbitrary and moved
 * it again on every open. Found by opening the example app, not by the suite.
 *
 * The anchor is observable through the positioner's `triggerWidth` /
 * `triggerHeight`, which are the anchor's measurements.
 */
const hidden = { includeHiddenElements: true } as const;

async function layout(measurements: [testID: string, width: number, height: number][]) {
  await act(async () => {
    for (const [testID, width, height] of measurements) {
      fireEvent(screen.getByTestId(testID, hidden), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
      });
    }
  });
}

describe('what the Combobox popup anchors to', () => {
  it('is the trigger when there is one, not the input inside the popup', async () => {
    const states: { triggerWidth: number | undefined }[] = [];

    await render(
      <Combobox.Root items={['Apple']} defaultOpen>
        <Combobox.Trigger testID="trigger">
          <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner
            style={(state) => {
              states.push({ triggerWidth: state.triggerWidth });
              return undefined;
            }}
          >
            <Combobox.Popup>
              <Combobox.Input testID="input" />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await layout([
      ['trigger', 300, 44],
      ['input', 180, 36],
    ]);

    // The trigger's width, even though the input laid out last.
    expect(states.at(-1)?.triggerWidth).toBe(300);
  });

  it('is the input when the combobox has no trigger', async () => {
    const states: { triggerWidth: number | undefined }[] = [];

    await render(
      <Combobox.Root items={['Apple']} defaultOpen>
        <Combobox.Input testID="input" />
        <Combobox.Portal>
          <Combobox.Positioner
            style={(state) => {
              states.push({ triggerWidth: state.triggerWidth });
              return undefined;
            }}
          >
            <Combobox.Popup>
              <Combobox.List>
                {(item) => <Text key={String(item.value)}>{item.label}</Text>}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await layout([['input', 180, 36]]);

    expect(states.at(-1)?.triggerWidth).toBe(180);
  });

  it('does not take the input measurement while a trigger has yet to lay out', async () => {
    const states: { triggerWidth: number | undefined }[] = [];

    await render(
      <Combobox.Root items={['Apple']} defaultOpen>
        <Combobox.Trigger testID="trigger">
          <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner
            style={(state) => {
              states.push({ triggerWidth: state.triggerWidth });
              return undefined;
            }}
          >
            <Combobox.Popup>
              <Combobox.Input testID="input" />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await layout([['input', 180, 36]]);

    // Undefined is the honest answer: sizing the popup to the input would be
    // wrong, and it is about to be corrected anyway.
    expect(states.at(-1)?.triggerWidth).toBeUndefined();
  });
});
