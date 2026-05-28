#!/usr/bin/env bash
# prepush-check.sh — local pre-push gate for @varshylinc toolkit packages
#
# Encodes publish-bug lessons from auth-social@0.1.0–0.1.1 and mobile-payments@0.1.0–0.1.1.
#
# Usage:
#   pnpm prepush -- @varshylinc/mobile-payments
#   pnpm prepush -- @varshylinc/auth-social --require-db
#   bash scripts/prepush-check.sh @varshylinc/mobile-payments [--require-db] [--packaging-only]
#
# Exits non-zero on first hard failure. Prints a summary block at the end.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PKG_NAME=""
REQUIRE_DB=false
PACKAGING_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --require-db) REQUIRE_DB=true ;;
    --packaging-only) PACKAGING_ONLY=true ;;
    @varshylinc/*) PKG_NAME="$arg" ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: bash scripts/prepush-check.sh @varshylinc/<package> [--require-db] [--packaging-only]"
      exit 1
      ;;
  esac
done

if [[ -z "$PKG_NAME" ]]; then
  echo "❌ Package name required (e.g. @varshylinc/mobile-payments)"
  exit 1
fi

PKG_DIR="${PKG_NAME#@varshylinc/}"
PKG_PATH="packages/$PKG_DIR"

if [[ ! -f "$PKG_PATH/package.json" ]]; then
  echo "❌ Package not found: $PKG_PATH"
  exit 1
fi

# Summary trackers (✅ / ❌ / ⚠️)
S_BRANCH="✅"
S_LINT="—"
S_TESTS="—"
S_BUILD="—"
S_CHANGELOG="—"
S_EXPORTS="—"
S_FILES="—"
S_TARBALL="—"
FAILED=false

fail() {
  echo "❌ $1"
  FAILED=true
  exit 1
}

warn() {
  echo "⚠️  $1"
}

pass() {
  echo "✅ $1"
}

# ── 1. Branch freshness (warn only) ───────────────────────────────────────────
echo "── Step 1: branch freshness ──"
git fetch origin main --quiet 2>/dev/null || warn "Could not fetch origin/main"
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [[ "$BEHIND" != "0" && "$BEHIND" -gt 0 ]]; then
  S_BRANCH="⚠️"
  warn "This branch is $BEHIND commits behind origin/main."
  echo "    Rebase before pushing:  git rebase origin/main"
  echo "    (Not auto-rebasing — resolve conflicts yourself, then re-run pnpm prepush.)"
else
  pass "Branch is up to date with origin/main (or ahead)"
fi

if [[ "$PACKAGING_ONLY" == true ]]; then
  S_LINT="⏭️"
  S_TESTS="⏭️"
  S_BUILD="⏭️"
  echo "── Skipping lint/tests/demo-host (--packaging-only) ──"
else
  # ── 2. Lint ───────────────────────────────────────────────────────────────────
  echo "── Step 2: lint ──"
  if pnpm lint; then
    S_LINT="✅"
    pass "pnpm lint"
  else
    S_LINT="❌"
    fail "pnpm lint failed"
  fi

  # ── 3. Package tests (Postgres) ─────────────────────────────────────────────
  echo "── Step 3: package tests ──"
  RUN_TESTS=true
  if [[ -z "${DATABASE_URL:-}" ]]; then
    if [[ "$REQUIRE_DB" == true ]]; then
      S_TESTS="❌"
      fail "DATABASE_URL not set (--require-db)"
    fi
    warn "DATABASE_URL not set — integration tests may be skipped by vitest"
    RUN_TESTS=true
  fi
  if [[ "$RUN_TESTS" == true ]]; then
    if DATABASE_URL="${DATABASE_URL:-}" pnpm -F "$PKG_NAME" test; then
      if [[ -z "${DATABASE_URL:-}" ]]; then
        S_TESTS="⚠️ skipped (no DB)"
        warn "Tests ran but DATABASE_URL was unset — integration tests likely skipped"
      else
        S_TESTS="✅"
        pass "pnpm -F $PKG_NAME test"
      fi
    else
      S_TESTS="❌"
      fail "pnpm -F $PKG_NAME test failed"
    fi
  fi

  # ── 4. Demo-host build ────────────────────────────────────────────────────────
  echo "── Step 4: demo-host build ──"
  if pnpm --filter @varshylinc/demo-host... build; then
    S_BUILD="✅"
    pass "pnpm --filter @varshylinc/demo-host... build"
  else
    S_BUILD="❌"
    fail "demo-host build failed"
  fi
fi

# ── 5. Changeset / CHANGELOG ──────────────────────────────────────────────────
echo "── Step 5: changeset / CHANGELOG ──"
VERSION=$(node -p "require('./$PKG_PATH/package.json').version")
HAS_CHANGELOG=false
if [[ -f "$PKG_PATH/CHANGELOG.md" ]] && grep -q "## ${VERSION}" "$PKG_PATH/CHANGELOG.md"; then
  HAS_CHANGELOG=true
fi
HAS_CHANGESET=false
if compgen -G ".changeset/*.md" > /dev/null; then
  if grep -rl "\"${PKG_NAME}\"" .changeset/*.md > /dev/null 2>&1; then
    HAS_CHANGESET=true
  fi
fi
echo "    package.json version: $VERSION"
if npx --yes @changesets/cli status 2>/dev/null; then
  echo "    (changeset status above)"
else
  warn "pnpm changeset status unavailable — continuing with CHANGELOG/changeset file check"
fi
echo "    Reminder: If this is a release, run 'pnpm changeset version' to generate the"
echo "    CHANGELOG entry before tagging — release.yml requires the ## <version> section."
if [[ "$HAS_CHANGELOG" == true ]]; then
  S_CHANGELOG="✅"
  pass "CHANGELOG.md has ## $VERSION"
elif [[ "$HAS_CHANGESET" == true ]]; then
  S_CHANGELOG="✅"
  pass "Pending changeset exists for $PKG_NAME"
else
  S_CHANGELOG="❌"
  fail "No CHANGELOG ## $VERSION and no pending changeset for $PKG_NAME"
fi

# ── 6. Build + exports map ────────────────────────────────────────────────────
echo "── Step 6: exports map ──"
pnpm --filter "$PKG_NAME" build
node - "$PKG_PATH" <<'NODE' || { S_EXPORTS="❌"; fail "exports map validation failed"; }
const fs = require('fs');
const path = require('path');
const pkgPath = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
const exportsMap = pkg.exports;
if (!exportsMap || typeof exportsMap !== 'object') {
  console.error('❌ package.json missing exports map');
  process.exit(1);
}
const required = ['types', 'require', 'import'];
let ok = true;
for (const [entry, conditions] of Object.entries(exportsMap)) {
  if (typeof conditions !== 'object' || conditions === null) continue;
  for (const cond of required) {
    if (!conditions[cond]) {
      console.error(`❌ exports['${entry}'] missing '${cond}' condition`);
      ok = false;
    }
  }
  for (const [cond, relPath] of Object.entries(conditions)) {
    if (cond === 'default') continue;
    const abs = path.join(pkgPath, relPath);
    if (!fs.existsSync(abs)) {
      console.error(`❌ exports['${entry}'].${cond} → ${relPath} not found on disk`);
      ok = false;
    }
  }
}
if (!ok) process.exit(1);
console.log('✅ exports map: types + require + import present; dist paths exist');
NODE
S_EXPORTS="✅"
pass "exports map validated"

# ── 7. files array ────────────────────────────────────────────────────────────
echo "── Step 7: files array ──"
node - "$PKG_PATH" <<'NODE' || { S_FILES="❌"; fail "files array validation failed"; }
const fs = require('fs');
const path = require('path');
const pkgPath = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
const files = pkg.files || [];
if (!files.includes('dist')) {
  console.error('❌ files array must include "dist"');
  process.exit(1);
}
const migSrc = path.join(pkgPath, 'migrations');
const migDist = path.join(pkgPath, 'dist', 'migrations');
const hasMigrations = fs.existsSync(migSrc) || fs.existsSync(migDist);
if (hasMigrations && !files.includes('migrations')) {
  console.error('❌ migrations/ exists but "migrations" not in files array');
  process.exit(1);
}
console.log('✅ files array includes dist' + (hasMigrations ? ' + migrations' : ''));
NODE
S_FILES="✅"
pass "files array validated"

# ── 8. Packed-tarball install test ────────────────────────────────────────────
echo "── Step 8: tarball install test ──"
TARBALL=""
TMPDIR_INSTALL=""
cleanup_tarball() {
  [[ -n "$TMPDIR_INSTALL" && -d "$TMPDIR_INSTALL" ]] && rm -rf "$TMPDIR_INSTALL"
  [[ -n "$TARBALL" && -f "$TARBALL" ]] && rm -f "$TARBALL"
}
trap cleanup_tarball EXIT

pushd "$PKG_PATH" > /dev/null
TARBALL_BASENAME="$(pnpm pack 2>/dev/null | grep -E '\.tgz$' | tail -1)"
TARBALL="$ROOT/$PKG_PATH/$TARBALL_BASENAME"
popd > /dev/null

if [[ ! -f "$TARBALL" ]]; then
  S_TARBALL="❌"
  fail "pnpm pack did not produce a tarball at $TARBALL"
fi

TMPDIR_INSTALL="$(mktemp -d)"
pushd "$TMPDIR_INSTALL" > /dev/null
npm init -y >/dev/null 2>&1
if ! npm install "$TARBALL" 2>&1; then
  popd > /dev/null
  S_TARBALL="❌"
  fail "npm install $TARBALL failed"
fi

node - "$PKG_NAME" <<'NODE' || { popd >/dev/null; S_TARBALL="❌"; fail "tarball install test failed"; }
const pkgName = process.argv[2];
const path = require('path');
const fs = require('fs');
const pkgJsonPath = path.resolve('node_modules', ...pkgName.split('/'), 'package.json');
const pkg = require(pkgJsonPath);

async function testRequire(reqPath) {
  const keys = Object.keys(require(reqPath)).sort().join(',');
  if (!keys) throw new Error('empty export keys');
  console.log(`✅ require('${reqPath}'): ${keys.slice(0, 80)}${keys.length > 80 ? '…' : ''}`);
}

async function testImport(reqPath) {
  const m = await import(reqPath);
  const keys = Object.keys(m).sort().join(',');
  if (!keys) throw new Error('empty export keys');
  console.log(`✅ import('${reqPath}'): ${keys.slice(0, 80)}${keys.length > 80 ? '…' : ''}`);
}

(async () => {
  const exportsMap = pkg.exports || { '.': {} };
  for (const sub of Object.keys(exportsMap)) {
    const reqPath = sub === '.' ? pkgName : `${pkgName}${sub.replace(/^\./, '')}`;
    await testRequire(reqPath);
    await testImport(reqPath);
  }
  const migDir = path.resolve('node_modules', ...pkgName.split('/'), 'migrations');
  if (fs.existsSync(migDir)) {
    const sql = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql'));
    if (sql.length === 0) throw new Error('migrations/ in tarball but no .sql files');
    console.log(`✅ migrations/: ${sql.length} .sql file(s)`);
  }
})().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
NODE
popd > /dev/null
S_TARBALL="✅"
pass "tarball install test passed"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────"
echo "PRE-PUSH SUMMARY for $PKG_NAME"
echo "  branch freshness ...... $S_BRANCH"
echo "  lint .................. $S_LINT"
echo "  tests (postgres) ...... $S_TESTS"
echo "  demo-host build ....... $S_BUILD"
echo "  changeset/changelog ... $S_CHANGELOG"
echo "  exports map ........... $S_EXPORTS"
echo "  files array ........... $S_FILES"
echo "  tarball install ....... $S_TARBALL"
echo "─────────────────────────────────────"
if [[ "$FAILED" == true ]]; then
  echo "RESULT: FAIL"
  exit 1
fi
echo "RESULT: PASS  (safe to push)"
exit 0
