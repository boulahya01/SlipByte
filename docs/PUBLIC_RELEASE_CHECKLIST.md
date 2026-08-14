# Public Release Checklist

OpenReceipt should not be made public or published to npm merely because the code compiles. Use this checklist before the first public release and before significant later releases.

## Repository

- [ ] repository visibility intentionally changed to public
- [ ] README accurately describes what exists today
- [ ] no placeholder claims presented as released functionality
- [ ] LICENSE, SECURITY.md, SUPPORT.md, CONTRIBUTING.md, and CODE_OF_CONDUCT.md are present
- [ ] issue and pull-request templates are active
- [ ] repository description and topics are set
- [ ] default branch and merge settings are reviewed
- [ ] branch protection / required checks are configured where available

## Source and secrets

- [ ] repository history checked for credentials, tokens, private keys, customer data, internal URLs, and private printer/network details
- [ ] `.env`, local certificates, debug captures, generated output, and editor files are ignored
- [ ] examples contain only synthetic receipt/customer data
- [ ] logs and fixtures do not contain sensitive real-world data
- [ ] no package code shells out or escalates privileges for the normal printing path

## Package quality

- [ ] `npm run check` passes from a clean checkout
- [ ] package lockfile is committed for reproducible contributor/CI installs
- [ ] `npm pack --dry-run` contains only intended distributable files
- [ ] public exports match documented API
- [ ] package name and npm ownership are confirmed
- [ ] package version follows semver
- [ ] `prepublishOnly` prevents publishing when validation fails
- [ ] npm provenance / trusted publishing is configured when the release workflow is introduced

## Compatibility claims

- [ ] every named printer compatibility claim has exact model evidence
- [ ] untested protocol compatibility is labeled as unverified
- [ ] unsupported capabilities fail explicitly rather than silently
- [ ] disruptive hardware actions are capability-aware and opt-in
- [ ] README distinguishes implemented, experimental, and planned functionality

## Security

- [ ] private vulnerability reporting path is verified
- [ ] network transports use timeouts and validate configuration
- [ ] errors and diagnostics avoid leaking secrets or receipt contents by default
- [ ] printer/network responses are treated as untrusted input
- [ ] dependencies are reviewed and kept minimal
- [ ] raw command escape hatches, if introduced, are clearly marked as advanced/unsafe APIs

## Developer experience

- [ ] first example works by copy/paste
- [ ] a hardware-free preview/mock path works
- [ ] common errors explain the next action
- [ ] TypeScript declarations are included in the npm artifact
- [ ] API names and defaults are consistent
- [ ] examples cover the supported Node.js versions

## AI-agent usability

- [ ] AGENTS.md matches current architecture
- [ ] public APIs document defaults, errors, capability requirements, and fallback behavior
- [ ] examples do not depend on hidden context
- [ ] structured errors are stable enough for tools to react to
- [ ] unsupported behavior is explicit instead of requiring inference

## Release decision

Only publish when the repository can answer these three questions accurately:

1. What does OpenReceipt support today?
2. What does it not support yet?
3. How can a developer verify behavior without risking production hardware or data?
