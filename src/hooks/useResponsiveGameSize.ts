import { useState, useEffect } from 'react';

// This is the ideal aspect ratio of our game area (width / height).
// Based on a ~900x600 canvas, a ratio of 1.5 is a good starting point.
const TARGET_ASPECT_RATIO = 1.5;

export function useResponsiveGameSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let newWidth: number;
      let newHeight: number;

      // Check if the screen is wider than our target aspect ratio (e.g., a desktop monitor)
      if (screenWidth / screenHeight > TARGET_ASPECT_RATIO) {
        // If so, the height is the limiting dimension.
        // We use 90% of the screen height to leave some vertical margin.
        newHeight = screenHeight * 0.98;
        newWidth = newHeight * TARGET_ASPECT_RATIO;
      } else {
        // Otherwise, the screen is taller (e.g., a phone in portrait mode).
        // The width is the limiting dimension.
        // We use 95% of the screen width to leave some horizontal margin.
        newWidth = screenWidth * 0.98;
        newHeight = newWidth / TARGET_ASPECT_RATIO;
      }
      
      setSize({ width: newWidth, height: newHeight });
    };

    // Add event listener and run it once initially
    window.addEventListener('resize', handleResize);
    handleResize();

    // Cleanup the event listener when the component unmounts
    return () => window.removeEventListener('resize', handleResize);
  }, []); // The empty dependency array ensures this effect runs only once

  return size;
}