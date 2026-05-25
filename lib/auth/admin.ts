/**
 * Helper to verify Basic Auth header.
 * Uses global `atob` to be compatible with Edge Runtime.
 */
export function verifyBasicAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }
  const base64Credentials = authHeader.split(' ')[1]
  if (!base64Credentials) return false

  try {
    const credentials = atob(base64Credentials)
    const [username, password] = credentials.split(':')
    return (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    )
  } catch {
    return false
  }
}

/**
 * Returns a 401 Response prompting browser basic auth dialog.
 */
export function getUnauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}
