export const ALLOWED_ADMIN_EMAIL = 'thebigel16@gmail.com';
export const ALLOWED_ADMIN_EMAILS = [ALLOWED_ADMIN_EMAIL];

export function isAllowedAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ALLOWED_ADMIN_EMAIL;
}

export function normalizeAccountRole<T extends { email: string }>(user: T) {
  const isAdmin = isAllowedAdminEmail(user.email);
  return {
    ...user,
    isAdmin,
    role: isAdmin ? ('ADMIN' as const) : ('USER' as const),
  };
}
