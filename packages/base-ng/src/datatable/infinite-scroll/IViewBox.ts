export interface IViewBox {
  /**
   * Top border offset from parent element
   */
  top: number;

  /**
   * Bottom border offset from parent element
   */
  bottom: number;

  /**
   * Offset if necessary (window or overflow mode)
   */
  diff?: number;

  /**
   * Value by which top and bottom where resized
   */
  resized?: number;

  /**
   * Scaled client height
   */
  scaled?: number;
}
