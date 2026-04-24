const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Creates a temporary directory with a scripts/ folder, 
 * copies the versioning script there, and initializes git.
 */
function setupSandbox() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-test-'));
  const scriptsDir = path.join(tmpDir, 'scripts');
  fs.mkdirSync(scriptsDir);

  const originalScript = path.resolve(__dirname, 'bump-version.js');
  fs.copyFileSync(originalScript, path.join(scriptsDir, 'bump-version.js'));

  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir });
  execSync('git config user.name "Test User"', { cwd: tmpDir });

  return tmpDir;
}

test('Version Bump Script Integration', async (t) => {
  await t.test('auto-increments patch version and syncs package.json', () => {
    const sandbox = setupSandbox();
    try {
      const appJson = { expo: { version: '1.0.0' } };
      const pkgJson = { version: '1.0.0' };

      fs.writeFileSync(path.join(sandbox, 'app.json'), JSON.stringify(appJson, null, 2));
      fs.writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify(pkgJson, null, 2));

      execSync('git add . && git commit -m "initial"', { cwd: sandbox, stdio: 'ignore' });

      // Run the production script inside the sandbox
      execSync('node scripts/bump-version.js', { cwd: sandbox, stdio: 'ignore' });

      const updatedApp = JSON.parse(fs.readFileSync(path.join(sandbox, 'app.json'), 'utf8'));
      const updatedPkg = JSON.parse(fs.readFileSync(path.join(sandbox, 'package.json'), 'utf8'));

      assert.strictEqual(updatedApp.expo.version, '1.0.1', 'app.json should be 1.0.1');
      assert.strictEqual(updatedPkg.version, '1.0.1', 'package.json should be 1.0.1');

      const status = execSync('git status --short', { cwd: sandbox, encoding: 'utf8' });
      assert.ok(status.includes('M  app.json'), 'app.json should be staged');
      assert.ok(status.includes('M  package.json'), 'package.json should be staged');
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  await t.test('respects manual version bump and syncs package.json', () => {
    const sandbox = setupSandbox();
    try {
      // 1. Establish 1.0.0 as the version in HEAD
      fs.writeFileSync(path.join(sandbox, 'app.json'), JSON.stringify({ expo: { version: '1.0.0' } }));
      fs.writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify({ version: '1.0.0' }));
      execSync('git add . && git commit -m "baseline"', { cwd: sandbox, stdio: 'ignore' });

      // 2. Simulate a manual bump to 1.1.0 in the working tree
      fs.writeFileSync(path.join(sandbox, 'app.json'), JSON.stringify({ expo: { version: '1.1.0' } }, null, 2));

      // 3. Run script - should notice the manual change and NOT increment to 1.1.1
      execSync('node scripts/bump-version.js', { cwd: sandbox, stdio: 'ignore' });

      const updatedApp = JSON.parse(fs.readFileSync(path.join(sandbox, 'app.json'), 'utf8'));
      const updatedPkg = JSON.parse(fs.readFileSync(path.join(sandbox, 'package.json'), 'utf8'));

      assert.strictEqual(updatedApp.expo.version, '1.1.0', 'Should keep manual 1.1.0');
      assert.strictEqual(updatedPkg.version, '1.1.0', 'package.json should sync to manual version');
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });
});