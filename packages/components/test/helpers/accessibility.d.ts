/** Types for accessibility.js, which the React package's tests import too. */
export interface ExposedNode {
  role: string;
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
}

export function exposedNodes(options?: { properties?: boolean }): Promise<ExposedNode[]>;
