import { warn } from './warn';

describe('warn', () => {
  let consoleWarn: jest.SpyInstance;

  beforeEach(() => {
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('prefixes the message with the library name', () => {
    warn('something is off');

    expect(consoleWarn).toHaveBeenCalledWith('Zest: something is off');
  });

  it('joins multiple message parts with a space', () => {
    warn('first part', 'second part');

    expect(consoleWarn).toHaveBeenCalledWith('Zest: first part second part');
  });

  // The module keeps a Set of everything it has already said, so a warning fired
  // from a component that rerenders does not flood the console.
  it('says the same thing only once', () => {
    warn('repeated message');
    warn('repeated message');
    warn('repeated message');

    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });
});
