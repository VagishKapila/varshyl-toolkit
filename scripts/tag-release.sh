#!/usr/bin/env bash
# Usage: bash scripts/tag-release.sh <package-name> <version>
# Creates a git tag: <package-name>-v<version>
set -e

PACKAGE=${1:?"Usage: $0 <package-name> <version>"}
VERSION=${2:?"Usage: $0 <package-name> <version>"}
TAG="${PACKAGE}-v${VERSION}"

# Validate version format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "❌ Invalid version format: $VERSION (must be X.Y.Z)"
  exit 1
fi

# Verify package exists
if [ ! -d "packages/$PACKAGE" ]; then
  echo "❌ Package 'packages/$PACKAGE' does not exist"
  exit 1
fi

# Verify package.json version matches
PKG_VERSION=$(node -p "require('./packages/$PACKAGE/package.json').version" 2>/dev/null || echo "")
if [ "$PKG_VERSION" != "$VERSION" ]; then
  echo "❌ package.json version ($PKG_VERSION) does not match tag version ($VERSION)"
  echo "   Update packages/$PACKAGE/package.json version first"
  exit 1
fi

echo "Creating tag: $TAG"
git tag -a "$TAG" -m "Release $TAG"
echo "✅ Tag '$TAG' created. Push with: git push origin $TAG"
