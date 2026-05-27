#!/usr/bin/env bash
# Usage: bash scripts/new-module.sh <module-name>
# Scaffolds a new package from team-management template structure
set -e

MODULE=${1:?"Usage: $0 <module-name>"}

if [ -d "packages/$MODULE" ]; then
  echo "❌ packages/$MODULE already exists"
  exit 1
fi

echo "Scaffolding packages/$MODULE from team-management template..."
cp -r packages/team-management "packages/$MODULE"

# Update package.json name and version
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('packages/$MODULE/package.json','utf8'));
pkg.name = '@varshylinc/$MODULE';
pkg.version = '0.0.1';
fs.writeFileSync('packages/$MODULE/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Clear CHANGELOG
cat > "packages/$MODULE/CHANGELOG.md" << EOF
# @varshylinc/$MODULE

## 0.0.1

### Initial scaffold

- Scaffolded from team-management template
EOF

echo "✅ packages/$MODULE created. Next steps:"
echo "  1. Update packages/$MODULE/src/server/types.ts — define adapter interface"
echo "  2. Update packages/$MODULE/src/server/migrations/ — add DB migration files"
echo "  3. Update packages/$MODULE/README.md — document the module"
echo "  4. Run: pnpm install && pnpm typecheck"
