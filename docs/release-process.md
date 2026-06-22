# Release Process

Shopify differs from WooCommerce / EC-CUBE distribution: merchants do not install a
plugin zip. Install is performed through a Shopify Custom Distribution OAuth link
issued after the merchant application is approved.

1. Confirm the version is synchronized:

   ```bash
   bash bin/verify-version.sh
   ```

2. Confirm the public release docs are current:

   ```bash
   git diff -- README.md CHANGELOG.md SECURITY.md docs/
   ```

3. Create the release commit and tag:

   ```bash
   git status --short
   git tag vX.Y.Z
   ```

4. Push the branch and tag after the D user gate:

   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

5. Create the GitHub release from the tag. Use `docs/release-template.md` as the
   release notes base.

6. Optional checksum assets:

   Shopify install does not require a zip asset. GitHub automatically provides
   source code archives for the tag. If attaching supplemental archives, create
   them from the release commit and attach `SHA256SUMS`.

   ```bash
   VERSION=X.Y.Z
   mkdir -p build/release
   git archive --format=zip --prefix="uniple-checkout-shopify-${VERSION}/" \
     --output="build/release/uniple-checkout-shopify-${VERSION}-source.zip" HEAD
   zip -r "build/release/uniple-checkout-shopify-${VERSION}-docs.zip" \
     README.md CHANGELOG.md LICENSE.md SECURITY.md docs
   (cd build/release && sha256sum *.zip > SHA256SUMS)
   ```

7. Confirm the release page links merchant installation to the application form:

   https://forms.gle/b8kwVZeynA1ffV8j6
