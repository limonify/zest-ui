import { error, reset } from './error';

describe('error', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    reset();
  });

  it('prefixes the message with the library name', () => {
    error('something broke');

    expect(consoleError).toHaveBeenCalledWith('Zest: something broke');
  });

  it('joins multiple message parts with a space', () => {
    error('first part', 'second part');

    expect(consoleError).toHaveBeenCalledWith('Zest: first part second part');
  });

  it('says the same thing only once', () => {
    error('repeated message');
    error('repeated message');

    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('says it again after reset', () => {
    error('resettable message');
    reset();
    error('resettable message');

    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});
