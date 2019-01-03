export const ensureHttpsUri = (uri: string) =>
  uri.replace(/^http:\/\//, 'https://')

export function generateRandomId(): string {
  return Math.random()
    .toString(36)
    .substring(7)
}
