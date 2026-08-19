# Releasing SlipByte

SlipByte separates release preparation from the final act that makes a package public.

## Release safety model

- normal development reaches `main` only through the protected pull-request flow;
- the release candidate must pass `npm run release:check` and the required Node.js 22/24 CI checks;
- automation does not create release tags, publish npm packages, or create GitHub Releases;
- no long-lived npm publish token is required for the steady-state release workflow;
- future automated releases use npm trusted publishing with OIDC and **stage-only** permission;
- a staged package is not public until a maintainer reviews and approves it with 2FA.

## First-package bootstrap

npm trusted-publisher configuration requires the package to already exist in the npm registry. Because `slipbyte` has not been published yet, trusted publishing cannot authenticate the first-ever package creation.

The safest bootstrap path is therefore an explicit maintainer action after the exact `0.1.0` release candidate has passed every release gate:

```bash
npm login
npm publish --access public
```

The interactive publish must use the maintainer's npm account with 2FA. Automation must not run this command or create/store a bypass-2FA token.

A locally bootstrapped first version does not get GitHub Actions provenance. This is an explicit bootstrap limitation, not evidence that later trusted releases lack provenance.

## Configure trusted publishing after the bootstrap publish

After `slipbyte` exists on npm, configure its Trusted Publisher with these values:

- provider: GitHub Actions
- GitHub user/organization: `boulahya01`
- repository: `SlipByte`
- workflow filename: `publish.yml`
- environment: leave unset unless a protected GitHub environment is intentionally added later
- allowed action: **`npm stage publish` only**

Then set the npm package publishing access to require 2FA and disallow traditional publish tokens.

The trusted-publisher workflow lives at `.github/workflows/publish.yml`. It requests only `contents: read` and `id-token: write` permissions.

## Future release flow

1. Prepare the next version through a normal protected PR.
2. Run the full release gate on the exact candidate and merge only after required checks pass.
3. The maintainer creates the intended `vX.Y.Z` tag on a commit already contained in `main`.
4. The maintainer manually dispatches **Stage npm release** and supplies that tag.
5. The workflow verifies that the input is a real tag, that `vX.Y.Z` matches `package.json`, and that the tagged commit is contained in `main`.
6. The workflow runs `npm ci` and `npm run release:check` again from the tagged source.
7. The workflow uses OIDC to run `npm stage publish`.
8. The maintainer reviews the staged package on npm and explicitly approves it with 2FA.
9. Only after approval does the version become publicly installable.

This keeps automated preparation separate from human publication approval.

## Provenance

npm trusted publishing from a supported GitHub-hosted Actions runner provides automatic provenance for public packages from public repositories. Verify the provenance/attestation on the first version released through the trusted-publishing flow rather than assuming it exists.

## Stopping rule

If the release tag does not match `package.json`, is not contained in `main`, validation fails, OIDC is not configured, or npm staging fails, stop. Do not bypass the check, substitute a long-lived publish token, retag history, or publish from an unreviewed commit.
