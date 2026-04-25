const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const REQUIRED_CONFIG = {
  bundleIdentifier: 'com.fourthgenplanner.app',
  androidPackage: 'com.fourthgenplanner.app',
  scheme: 'fourthgenplanner',
};

const errors = [];

if (appJson.expo.ios.bundleIdentifier !== REQUIRED_CONFIG.bundleIdentifier) errors.push(`iOS bundleIdentifier must be ${REQUIRED_CONFIG.bundleIdentifier}`);
if (appJson.expo.android.package !== REQUIRED_CONFIG.androidPackage) errors.push(`Android package must be ${REQUIRED_CONFIG.androidPackage}`);
if (appJson.expo.scheme !== REQUIRED_CONFIG.scheme) errors.push(`URL Scheme must be ${REQUIRED_CONFIG.scheme}`);

// Note: the OAuth redirect scheme (reverse client ID) lives in AndroidManifest.xml
// as a manual post-prebuild fix and cannot be verified from app.json.

if (errors.length > 0) {
  console.error('[verify-config] ❌ Configuration Error:');
  errors.forEach(err => console.error(` - ${err}`));
  process.exit(1);
}

console.log('[verify-config] ✅ app.json integrity verified.');
