/**
 * ThingsPanel Platform Integration Utilities
 * 
 * Helper functions for verifying and interacting with ThingsPanel platform.
 */

/**
 * Verify ThingsPanel JWT Token
 * 
 * @param token - ThingsPanel JWT token to verify
 * @returns Promise<boolean> - True if token is valid
 * 
 * @example
 * const isValid = await verifyThingsPanelToken('tp_jwt_token_here')
 * if (!isValid) {
 *   throw new Error('Invalid ThingsPanel token')
 * }
 */
export async function verifyThingsPanelToken(token: string): Promise<boolean> {
    try {
        // TODO: Implement actual ThingsPanel token verification
        // This should call ThingsPanel's token verification API

        // Option 1: Call ThingsPanel's verification endpoint
        // const response = await fetch('https://demo.thingspanel.cn/api/auth/verify', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // })
        // return response.ok

        // Option 2: Verify JWT signature if you have ThingsPanel's public key
        // const { payload } = await jwtVerify(token, thingsPanelPublicKey)
        // return !!payload

        // For development: accept all tokens
        console.warn('[ThingsPanel] Token verification not implemented, accepting all tokens in development mode')
        return true
    } catch (error) {
        console.error('[ThingsPanel] Token verification error:', error)
        return false
    }
}

/**
 * Get ThingsPanel User Info
 * 
 * Fetches user information from ThingsPanel using a valid token
 * 
 * @param token - ThingsPanel JWT token
 * @returns Promise<UserInfo | null> - User information or null if failed
 */
export async function getThingsPanelUserInfo(token: string): Promise<{
    id: string
    email: string
    name?: string
    tenantId: string
} | null> {
    try {
        // TODO: Implement actual ThingsPanel user info API call
        // const response = await fetch('https://demo.thingspanel.cn/api/user/me', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // })
        // 
        // if (!response.ok) {
        //   return null
        // }
        // 
        // const data = await response.json()
        // return {
        //   id: data.id,
        //   email: data.email,
        //   name: data.name,
        //   tenantId: data.tenantId
        // }

        console.warn('[ThingsPanel] User info fetch not implemented')
        return null
    } catch (error) {
        console.error('[ThingsPanel] Get user info error:', error)
        return null
    }
}
