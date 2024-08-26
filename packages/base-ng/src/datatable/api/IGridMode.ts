export class IGridMode {
  name: string;
  label: string;
}

export const K_PAGED = 'paged';
export const K_INFINITE = 'infinite';
export const K_VIEW = 'view';

export const K_OPTIONS = 'options';

/**
 * - paged - a pager will be integrated in the view
 * - infinite - an infinite scoll with reload on page bottom reach
 * - view - show only the once loaded rows
 */
export type T_GRID_MODE = 'paged' | 'infinite' | 'view';
/**
 * List with supported grid modes
 */
export const GRID_MODES: IGridMode[] = [
  { name: K_VIEW, label: K_VIEW },
  { name: K_PAGED, label: K_PAGED },
  { name: K_INFINITE, label: K_INFINITE }
];
