import * as REASONS from './reason-parts';

export { REASONS };
export type ZestEventReasons = typeof REASONS;
export type ZestEventReason = ZestEventReasons[keyof ZestEventReasons];
