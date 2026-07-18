import { resetAnimationFrameScheduler } from './src/hooks/useAnimationFrame';

// Swaps gesture-handler's native module for its mock, which is what lets
// `fireGestureHandler` drive a Pan gesture in tests. Lives here rather than in
// `setupFiles` so it doesn't displace the jest-expo preset's own entries.
require('react-native-gesture-handler/jestSetup');

// The animation frame scheduler is process-global. A callback scheduled by one
// test but never run would otherwise survive into a later test and fire there
// against stale state, showing up as an act(...) warning in an unrelated file.
afterEach(() => {
  resetAnimationFrameScheduler();
});
