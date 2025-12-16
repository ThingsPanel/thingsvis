/**
 * Visual Component Interface
 * 
 * Defines the contract for visual components that can be managed by the kernel.
 * Components implementing this interface can be mounted, updated, resized, and unmounted.
 */

/**
 * Interface for visual components that can be managed by the kernel lifecycle system.
 * 
 * Components must implement all four lifecycle methods:
 * - mount: Initialize and attach to DOM element
 * - update: Update component properties
 * - resize: Adjust component dimensions
 * - unmount: Clean up and detach from DOM
 */
export interface IVisualComponent {
  /**
   * Mounts the component to the provided DOM element.
   * Called once when the component is first added to the page.
   * 
   * @param el - The HTML element to mount the component to
   * @param props - Component properties from schema (Record<string, unknown>)
   * @throws Error if element is invalid or component cannot be mounted
   * 
   * Preconditions:
   * - Component is not already mounted
   * - el is a valid, attached HTMLElement
   * - props conforms to component's expected property structure
   * 
   * Postconditions:
   * - Component is attached to el
   * - Component is initialized and ready to render
   * - Component state reflects props values
   */
  mount(el: HTMLElement, props: Record<string, unknown>): void;

  /**
   * Updates the component with new properties.
   * Called whenever component props change.
   * 
   * @param props - Updated component properties (Record<string, unknown>)
   * @throws Error if component is not mounted or update fails
   * 
   * Preconditions:
   * - Component is mounted (mount() was called successfully)
   * - props conforms to component's expected property structure
   * 
   * Postconditions:
   * - Component state reflects new props values
   * - Component re-renders if necessary
   */
  update(props: Record<string, unknown>): void;

  /**
   * Resizes the component to new dimensions.
   * Called when container/viewport size changes.
   * 
   * @param width - New width in pixels
   * @param height - New height in pixels
   * @throws Error if component is not mounted or resize fails
   * 
   * Preconditions:
   * - Component is mounted
   * - width and height are positive numbers (>= 1)
   * 
   * Postconditions:
   * - Component dimensions match width and height
   * - Component layout adjusts if necessary
   */
  resize(width: number, height: number): void;

  /**
   * Unmounts the component and cleans up resources.
   * Called when component is removed from the page.
   * Safe to call multiple times (idempotent).
   * 
   * Preconditions:
   * - None (idempotent - safe to call multiple times)
   * 
   * Postconditions:
   * - Component is detached from DOM
   * - All resources are cleaned up
   * - Component is in unmounted state
   * 
   * Error Conditions:
   * - None (must not throw errors, even if already unmounted)
   */
  unmount(): void;
}

