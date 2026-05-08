#!/usr/bin/env bash
# Verify no cross-module imports between packages
# Each package must be self-contained — modules NEVER import each other
set -e

PACKAGES_DIR="$(dirname "$0")/../packages"
ERRORS=0

if [ ! -d "$PACKAGES_DIR" ]; then
  echo "No packages/ directory found, skipping cross-import check."
  exit 0
fi

PACKAGE_NAMES=()
for pkg_dir in "$PACKAGES_DIR"/*/; do
  if [ -d "$pkg_dir" ]; then
    pkg_name=$(basename "$pkg_dir")
    PACKAGE_NAMES+=("$pkg_name")
  fi
done

if [ ${#PACKAGE_NAMES[@]} -le 1 ]; then
  echo "Only one package exists — no cross-import violations possible."
  exit 0
fi

echo "Checking for cross-module imports among: ${PACKAGE_NAMES[*]}"

for pkg_dir in "$PACKAGES_DIR"/*/; do
  pkg_name=$(basename "$pkg_dir")
  src_dir="$pkg_dir/src"
  if [ ! -d "$src_dir" ]; then
    continue
  fi

  for other_pkg in "${PACKAGE_NAMES[@]}"; do
    if [ "$other_pkg" = "$pkg_name" ]; then
      continue
    fi
    # Check if this package imports from any other package
    if grep -r "@varshyl/$other_pkg" "$src_dir" --include="*.ts" --include="*.tsx" -l 2>/dev/null | grep -q .; then
      echo "❌ CROSS-IMPORT VIOLATION: $pkg_name imports from @varshyl/$other_pkg"
      echo "   Violating files:"
      grep -r "@varshyl/$other_pkg" "$src_dir" --include="*.ts" --include="*.tsx" -l
      ERRORS=$((ERRORS + 1))
    fi
  done
done

if [ $ERRORS -eq 0 ]; then
  echo "✅ No cross-module imports detected."
  exit 0
else
  echo "❌ $ERRORS cross-import violation(s) found. Modules must not import each other."
  exit 1
fi
