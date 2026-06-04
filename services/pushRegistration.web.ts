/**
 * Web stub for push registration.
 *
 * expo-notifications has no usable web push support here, so there is no token
 * to obtain — callers already treat a null token as "no push". Living in a
 * .web.ts file means Metro resolves this on web instead of pushRegistration.ts,
 * keeping expo-notifications out of the web bundle (Vercel runs
 * `expo export --platform web`).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}
