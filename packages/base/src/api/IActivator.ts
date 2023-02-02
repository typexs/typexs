export interface IActivator {

  /**
   * Return config schema as json.
   */
  configSchema?(): any;

  /**
   * Execute preparation running after runtimeloader is active
   */
  prepare?(): void;

  /**
   * Activate module run after storage
   */
  startup(): void;


}
