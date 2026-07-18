import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar } from '../index';

const SOURCE = { uri: 'https://example.com/avatar.png' };

function TestAvatar({
  delay,
  ...rootProps
}: React.ComponentProps<typeof Avatar.Root> & { delay?: number }) {
  return (
    <Avatar.Root testID="root" {...rootProps}>
      <Avatar.Image testID="image" source={SOURCE} />
      <Avatar.Fallback testID="fallback" delay={delay}>
        <Text>EB</Text>
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

/** The RN Image reports its progress through these; nothing loads in a test. */
async function loadStart() {
  await act(async () => {
    fireEvent(screen.getByTestId('image'), 'loadStart');
  });
}

async function loaded() {
  await act(async () => {
    fireEvent(screen.getByTestId('image'), 'load');
  });
}

async function errored() {
  await act(async () => {
    fireEvent(screen.getByTestId('image'), 'error');
  });
}

describe('Avatar', () => {
  it('renders every part', async () => {
    await render(<TestAvatar />);

    expect(screen.getByTestId('root')).toBeTruthy();
    expect(screen.getByTestId('image')).toBeTruthy();
    expect(screen.getByTestId('fallback')).toBeTruthy();
  });

  it('throws when a part is used outside Avatar.Root', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Avatar.Fallback />)).rejects.toThrow(/must be placed within <Avatar.Root>/);

    error.mockRestore();
  });

  describe('loading status', () => {
    it('starts idle', async () => {
      const seen: string[] = [];
      await render(
        <Avatar.Root
          style={(state) => {
            seen.push(state.imageLoadingStatus);
            return {};
          }}
        />,
      );

      expect(seen).toEqual(['idle']);
    });

    it("reports the image's status up to the root", async () => {
      const seen: string[] = [];
      await render(
        <Avatar.Root
          style={(state) => {
            seen.push(state.imageLoadingStatus);
            return {};
          }}
        >
          <Avatar.Image testID="image" source={SOURCE} />
        </Avatar.Root>,
      );

      await loadStart();
      await loaded();

      expect(seen).toEqual(['idle', 'loading', 'loaded']);
    });

    it('fires onLoadingStatusChange for every transition', async () => {
      const onLoadingStatusChange = jest.fn();
      await render(
        <Avatar.Root>
          <Avatar.Image testID="image" source={SOURCE} onLoadingStatusChange={onLoadingStatusChange} />
        </Avatar.Root>,
      );

      await loadStart();
      await loaded();

      expect(onLoadingStatusChange.mock.calls.map(([status]) => status)).toEqual([
        'loading',
        'loaded',
      ]);
    });

    it('resets the root status when the image unmounts', async () => {
      const view = await render(<TestAvatar />);
      await loaded();
      expect(screen.queryByTestId('fallback')).toBeNull();

      await view.rerender(
        <Avatar.Root testID="root">
          <Avatar.Fallback testID="fallback">
            <Text>EB</Text>
          </Avatar.Fallback>
        </Avatar.Root>,
      );

      // Without the reset the root would still believe an image is loaded and
      // the fallback would stay hidden.
      expect(screen.getByTestId('fallback')).toBeTruthy();
    });
  });

  describe('Avatar.Fallback', () => {
    it('is shown while the image has not loaded', async () => {
      await render(<TestAvatar />);

      await loadStart();

      expect(screen.getByTestId('fallback')).toBeTruthy();
    });

    it('is hidden once the image loads', async () => {
      await render(<TestAvatar />);

      await loaded();

      expect(screen.queryByTestId('fallback')).toBeNull();
    });

    it('is shown again when the image errors', async () => {
      await render(<TestAvatar />);

      await errored();

      expect(screen.getByTestId('fallback')).toBeTruthy();
    });

    it('waits for the delay before showing', async () => {
      jest.useFakeTimers();
      try {
        await render(<TestAvatar delay={500} />);

        expect(screen.queryByTestId('fallback')).toBeNull();

        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        expect(screen.getByTestId('fallback')).toBeTruthy();
      } finally {
        jest.useRealTimers();
      }
    });

    it('never shows the delayed fallback if the image loads first', async () => {
      jest.useFakeTimers();
      try {
        await render(<TestAvatar delay={500} />);
        await loaded();

        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        expect(screen.queryByTestId('fallback')).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('Avatar.Image', () => {
    it('stays mounted before it loads, unlike the web', async () => {
      await render(<TestAvatar />);

      // An RN Image only fetches once mounted, so there is no preload phase to
      // hide it during.
      expect(screen.getByTestId('image')).toBeTruthy();
    });

    it('publishes the loading status and transition status to a style function', async () => {
      const seen: Array<[string, string | undefined]> = [];
      await render(
        <Avatar.Root>
          <Avatar.Image
            testID="image"
            source={SOURCE}
            style={(state) => {
              seen.push([state.imageLoadingStatus, state.transitionStatus]);
              return {};
            }}
          />
        </Avatar.Root>,
      );

      await loaded();

      expect(seen[0]).toEqual(['idle', undefined]);
      expect(seen.at(-1)?.[0]).toBe('loaded');
    });
  });
});
