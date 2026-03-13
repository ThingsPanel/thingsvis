export interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface IAuthProvider {
  /**
   * Validates an incoming token and resolves user context.
   * Throws an error or returns undefined if token is invalid.
   */
  validateToken(token: string): Promise<UserContext>;
}
