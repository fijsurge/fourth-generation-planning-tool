// Dynamic Expo config — extends app.json so we can read env vars at build
// time (e.g. to construct the Android OAuth reverse-client-ID intent filter).
// bump-version.js continues to update the version field in app.json as before.

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? "";

// "123-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.123-abc"
const reverseClientIdScheme = androidClientId
  ? `com.googleusercontent.apps.${androidClientId.replace(".apps.googleusercontent.com", "")}`
  : undefined;

export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // Register the reverse-client-ID scheme so Android routes the OAuth
    // redirect back to this app instead of falling through to the browser.
    ...(reverseClientIdScheme && {
      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: reverseClientIdScheme }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    }),
  },
});
