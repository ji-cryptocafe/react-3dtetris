import { useState, useEffect } from 'react';

// This is the ideal aspect ratio for a *landscape* view.
const LANDSCAPE_ASPECT_RATIO = 1.1;

export function useResponsiveGameSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let newWidth: number;
      let newHeight: number;

      // highlight-start
      // Determine the ideal aspect ratio for the container based on the screen's orientation.
      // We also add a small buffer (0.9) to the portrait ratio to make it slightly less tall,
      // which often looks better and leaves more room for UI elements.
      const isPortrait = screenHeight > screenWidth;
      const targetAspectRatio = isPortrait 
        ? (1 / LANDSCAPE_ASPECT_RATIO)
        : LANDSCAPE_ASPECT_RATIO;
      // highlight-end

      // Check if the screen is WIDER than our target aspect ratio.
      if (screenWidth / screenHeight > targetAspectRatio) {
        // If so, the height is the limiting dimension.
        // We use 98% of the screen height to leave some vertical margin.
        newHeight = screenHeight * 0.98;
        newWidth = newHeight * targetAspectRatio;
      } else {
        // Otherwise, the width is the limiting dimension.
        // We use 98% of the screen width to leave some horizontal margin.
        newWidth = screenWidth * 0.98;
        newHeight = newWidth / targetAspectRatio;
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