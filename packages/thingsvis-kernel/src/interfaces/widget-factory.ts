import type { IVisualComponent } from './visual-component';

/**
 * Plugin Factory Interface
 * 
 * Defines the contract for factories that create component instances.
 * Factories enable dynamic widget loading and component instantiation.
 */

/**
 * Interface for factories that create visual component instances.
 * 
 * Factories must implement the create method to instantiate components
 * by type identifier. This enables the kernel to dynamically create
 * component instances from loaded widgets without requiring kernel recompilation.
 */
export interface IWidgetFactory {
  /**
   * Creates a new component instance of the specified type.
   * 
   * @param type - Component type identifier (e.g., 'echarts-bar', 'custom-widget')
   * @returns A new component instance implementing IVisualComponent
   * @throws Error if component type is not supported or creation fails
   * 
   * Preconditions:
   * - type is a non-empty string
   * - Factory supports the requested component type
   * - Factory has necessary resources to create component
   * 
   * Postconditions:
   * - Returns a new IVisualComponent instance
   * - Returned instance is ready for mount() call
   * - Returned instance is independent (not shared with other calls)
   * 
   * Error Conditions:
   * - type is empty or invalid → Throw TypeError or Error with message "Invalid component type"
   * - Component type not supported → Throw Error with message "Component type '{type}' not supported"
   * - Creation fails (e.g., missing dependencies) → Throw Error with message describing failure
   */
  create(type: string): IVisualComponent;
}

