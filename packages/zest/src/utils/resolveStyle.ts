import type { ZestStyle, ZestStyleValue } from '../types';

/**
 * If the provided style is a React Native style value, it will be returned as is.
 * Otherwise, the function will call the style function with the state as the first argument.
 */
export function resolveStyle<State>(
  style: ZestStyle<State>,
  state: State,
): ZestStyleValue | undefined {
  return typeof style === 'function' ? style(state) : style;
}
