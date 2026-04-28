import React from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Custom hook to track when scroll position exceeds a threshold
 * Useful for triggering animations or conditional rendering based on scroll position
 * 
 * @param threshold - Scroll distance (in pixels) to trigger the callback (default: 5)
 * @returns Object containing:
 *   - hasScrolled: boolean state tracking if scroll exceeded threshold
 *   - onScroll: scroll event handler for ScrollView
 *   - scrollEventThrottle: throttle value (16) for performance optimization
 */
export const useScrollPastThreshold = (threshold: number = 5) => {
  const [hasScrolled, setHasScrolled] = React.useState(false);

  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setHasScrolled(event.nativeEvent.contentOffset.y > threshold);
  }, [threshold]);

  return {
    hasScrolled,
    onScroll,
    scrollEventThrottle: 16, // Optimize scroll event frequency
  };
};
