/**
 * Helper function to set scroll value
 * @param el
 * @param options
 */
export function scrollTo(el: HTMLElement | Window, options: { top: number; left: number }) {
  if (el instanceof HTMLElement) {
    if (options.top != null) {
      const sc = Object.getOwnPropertyDescriptor(el, 'scrollTop');
      if (sc) {
        el.scrollTop = options.top;
      } else {
        Object.defineProperty(el, 'scrollTop', { value: options.top, writable: true });
      }
    }
    if (options.left != null) {
      const sc = Object.getOwnPropertyDescriptor(el, 'scrollLeft');
      if (sc) {
        el.scrollLeft = options.left;
      } else {
        Object.defineProperty(el, 'scrollLeft', { value: options.left, writable: true });
      }
    }
  } else {
    el.scroll(options);
  }
}


function mean(nrs: number[]) {
  return nrs.reduce((previousValue, currentValue) => previousValue + currentValue) / nrs.length;
}
