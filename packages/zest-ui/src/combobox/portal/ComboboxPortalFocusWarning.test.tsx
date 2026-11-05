import * as React from 'react';
import { render } from '@testing-library/react-native';
import { Combobox } from '../index';

/**
 * A Modal portal takes focus from an input outside it, which stops typing. The
 * warning fires once per message, so the shapes that must stay silent run first
 * and the one that warns runs last.
 */
describe('Combobox.Portal focus warning', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function warnings() {
    return warnSpy.mock.calls.filter(([message]) => String(message).includes('loses focus'));
  }

  it('stays silent with the input inside the popup', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Trigger />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Input />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(warnings()).toHaveLength(0);
  });

  it('stays silent with modal={false}', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Portal modal={false}>
          <Combobox.Positioner>
            <Combobox.Popup />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(warnings()).toHaveLength(0);
  });

  it('stays silent while the list is closed', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(warnings()).toHaveLength(0);
  });

  it('warns when a Modal opens over an input outside it', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(warnings()).toHaveLength(1);
    expect(warnings()[0][0]).toContain('modal={false}');
  });
});
