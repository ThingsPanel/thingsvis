/**
 * Error codes for grid layout operations
 */
export type GridErrorCode = 
  | 'INVALID_POSITION'
  | 'OUT_OF_BOUNDS'
  | 'ITEM_NOT_FOUND'
  | 'CONSTRAINT_VIOLATION';

/**
 * Custom error class for grid layout operations
 */
export class GridLayoutError extends Error {
  public readonly code: GridErrorCode;
  public readonly details?: Record<string, unknown>;
  
  constructor(
    message: string,
    code: GridErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GridLayoutError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GridLayoutError);
    }
  }
  
  /**
   * Factory method for invalid position errors
   */
  static invalidPosition(details: Record<string, unknown>): GridLayoutError {
    return new GridLayoutError(
      'Position has negative values or NaN',
      'INVALID_POSITION',
      details
    );
  }
  
  /**
   * Factory method for out of bounds errors
   */
  static outOfBounds(details: Record<string, unknown>): GridLayoutError {
    return new GridLayoutError(
      'Position exceeds grid column count',
      'OUT_OF_BOUNDS',
      details
    );
  }
  
  /**
   * Factory method for item not found errors
   */
  static itemNotFound(id: string): GridLayoutError {
    return new GridLayoutError(
      `Grid item not found: ${id}`,
      'ITEM_NOT_FOUND',
      { id }
    );
  }
  
  /**
   * Factory method for constraint violation errors
   */
  static constraintViolation(details: Record<string, unknown>): GridLayoutError {
    return new GridLayoutError(
      'Size exceeds min/max constraints',
      'CONSTRAINT_VIOLATION',
      details
    );
  }
}
