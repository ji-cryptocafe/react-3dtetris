// These are the direction vectors for edges extending along the X, Y, and Z axes.
export const DIRS: [number, number, number][] = [
    [1, 0, 0],  // X-axis edge
    [0, 1, 0],  // Y-axis edge
    [0, 0, 1]   // Z-axis edge
  ];
  
  /**
   * Creates a unique, consistent string key for an edge.
   * An edge is defined by its minimum corner (x, y, z) and its direction (0 for X, 1 for Y, 2 for Z).
   */
  export function edgeKey(x: number, y: number, z: number, dir: number): string {
    return `${x},${y},${z},${dir}`;
  }