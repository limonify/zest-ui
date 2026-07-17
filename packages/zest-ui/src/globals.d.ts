/*
 * Minimal ambient declarations for globals that exist in every React Native
 * runtime (Hermes / JSC / react-native-web) but aren't part of the ES lib.
 * We deliberately avoid pulling in the full DOM lib or @types/node.
 */

declare const process: { env: { NODE_ENV?: string } };

type FrameRequestCallback = (time: number) => void;

declare function requestAnimationFrame(callback: FrameRequestCallback): number;
declare function cancelAnimationFrame(handle: number): void;

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number): number;
declare function clearTimeout(handle?: number): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number): number;
declare function clearInterval(handle?: number): void;

// Aliased to `global` on native and in react-native's jest setup; native on
// react-native-web. Referenced only behind `typeof` guards.
declare const window: unknown | undefined;
