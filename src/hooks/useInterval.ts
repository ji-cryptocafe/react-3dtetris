import { useEffect, useRef } from 'react';

// Define the type for the callback function
type Callback = () => void;

export function useInterval(callback: Callback, delay: number | null) {
  // Use a ref to store the callback. Initialize with the callback itself.
  const savedCallback = useRef<Callback>(callback);

  // Update the ref to the latest callback on each render
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    if (delay === null) {
      return;
    }

    const id = setInterval(() => savedCallback.current(), delay);

    // Clear the interval on cleanup.
    return () => clearInterval(id);
  }, [delay]);
}