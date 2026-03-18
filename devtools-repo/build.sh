#!/usr/bin/env bash
# ============================================================
# build.sh — Packager une nouvelle version de l'extension
# Usage : ./build.sh 1.3.0
# ============================================================

set -e

VERSION=${1:-""}
if [ -z "$VERSION" ]; then
  echo "❌ Usage : ./build.sh <version>  (ex: ./build.sh 1.3.0)"
  exit 1
fi

REPO="TON_PSEUDO/TON_REPO"   # ← à remplacer
ZIP_NAME="devtools-extension.zip"

echo "📦 Build v$VERSION..."

# 1. Mettre à jour la version dans manifest.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" extension/manifest.json
echo "  ✓ manifest.json → version $VERSION"

# 2. Mettre à jour updates.xml
sed -i "s/version='[^']*'/version='$VERSION'/" updates.xml
echo "  ✓ updates.xml → version $VERSION"

# 3. Créer le ZIP (depuis le dossier extension/)
rm -f "$ZIP_NAME"
cd extension && zip -r "../$ZIP_NAME" . -x "*.DS_Store" -x "__MACOSX/*" && cd ..
echo "  ✓ $ZIP_NAME créé ($(du -sh $ZIP_NAME | cut -f1))"

# 4. Commit + tag Git
git add extension/manifest.json updates.xml "$ZIP_NAME"
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"

echo ""
echo "✅ Build terminé."
echo ""
echo "👉 Prochaines étapes :"
echo "   git push origin main --tags"
echo "   → GitHub Pages servira automatiquement le nouveau updates.xml et le ZIP"
echo ""
echo "   Délai de mise à jour Chrome : quelques heures (max 5h)"
echo "   Pour forcer : chrome://extensions → Mettre à jour les extensions"
