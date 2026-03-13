/**
 * Host Platform Integration Utilities
 *
 * Helper functions for verifying tokens and fetching user info from the host platform.
 */

/**
 * Verify a platform JWT token.
 *
 * @param token - Platform JWT token to verify
 * @returns Promise<boolean> - True if token is valid
 *
 * @example
 * const isValid = await verifyPlatformToken('jwt_token_here')
 * if (!isValid) {
 *   throw new Error('Invalid platform token')
 * }
 */
export async function verifyPlatformToken(_token: string): Promise<boolean> {
  try {
    // TODO: Implement actual platform token verification.
    // Call the host platform's token verification endpoint, e.g.:
    // const response = await fetch(`${process.env.PLATFORM_API_URL}/api/auth/verify`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // })
    // return response.ok

    // Development mode: accept all tokens
    console.warn(
      '[Platform] Token verification not implemented, accepting all tokens in development mode',
    );
    return true;
  } catch (error) {
    console.error('[Platform] Token verification error:', error);
    return false;
  }
}

/**
 * Get user info from the host platform.
 *
 * @param token - Platform JWT token
 * @returns Promise<UserInfo | null> - User information or null if the request fails
 */
export async function getPlatformUserInfo(_token: string): Promise<{
  id: string;
  email: string;
  name?: string;
  tenantId: string;
} | null> {
  try {
    // TODO: Implement actual platform user info API call, e.g.:
    // const response = await fetch(`${process.env.PLATFORM_API_URL}/api/user/me`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // })
    // if (!response.ok) return null
    // const data = await response.json()
    // return { id: data.id, email: data.email, name: data.name, tenantId: data.tenantId }

    console.warn('[Platform] User info fetch not implemented');
    return null;
  } catch (error) {
    console.error('[Platform] Get user info error:', error);
    return null;
  }
}
