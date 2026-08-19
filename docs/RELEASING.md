# Releasing SlipByte

SlipByte separates release preparation from the action that makes a package public.

## Current setup

`slipbyte@0.1.0` was the first-package bootstrap release. It was published interactively by the maintainer with npm account 2FA after the exact release candidate passed the project release gate.

Because that first version was published locally, `0.1.0` does **not** have GitHub Actions provenance.

Future releases use npm Trusted Publishing with GitHub OIDC:

- GitHub user/organization: `boulahya01`
- repository: `SlipByte`
- workflow: `publish.yml`
- allowed action: **`npm stage publish` only**
- no GitHub environment restriction unless one is intentionally added later
- npm publishing access requires 2FA and disallows bypass-2FA tokens

The workflow lives at `.github/workflows/publish.yml` and requests only `contents: read` and `id-token: write`.

## Future release flow

1. Prepare the version through a normal protected pull request.
2. Run `npm run release:check` and require the Node.js 22/24 CI checks to pass on the exact candidate content.
3. Merge through the protected `main` branch.
4. The maintainer creates the intended `vX.Y.Z` tag on a commit already contained in `main`.
5. Manually dispatch **Stage npm release** with that tag.
6. The workflow verifies the tag exists, matches `package.json`, and points to content contained in `main`.
7. The workflow runs `npm ci` and `npm run release:check` again.
8. GitHub OIDC runs `npm stage publish` without a long-lived npm publish token.
9. The maintainer reviews the staged package and approves publication with 2FA.

A staged package is not public until the maintainer completes the npm approval step.

## Provenance

Trusted publishing from a supported GitHub-hosted Actions runner can provide automatic provenance for public packages. Verify the attestation on the first version released through this staged workflow rather than assuming it exists.

## Safety rules

Stop the release if any of these are false:

- tag version matches `package.json`
- tagged commit is contained in protected `main`
- release checks pass
- OIDC trusted publishing is active
- staged package contents are expected

Do not bypass a failed gate with a long-lived publish token, retag history to hide a mismatch, or publish from an unreviewed commit.

Git tags and GitHub Releases are separate maintainer-controlled actions; automation does not create them without explicit authorization.
