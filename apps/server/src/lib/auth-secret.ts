export function authSecret(): string {
  const secret = process.env.AUTH_SECRET || '';
  if (
    secret.length < 32 ||
    new Set(secret).size < 12 ||
    /change-me|thingsvis-dev-secret/i.test(secret)
  ) {
    throw new Error(
      'AUTH_SECRET must be a deployment-specific random secret of at least 32 characters',
    );
  }
  return secret;
}
