# Security Policy

OpenReceipt interacts with local and network-connected printer hardware. Security reports are taken seriously, especially when they involve device access, network transport, command injection, unsafe parsing, dependency compromise, or unintended data exposure.

## Supported versions

OpenReceipt is not yet generally released. Until the first stable release, security fixes apply to the latest development version only.

After releases begin, this section will list supported versions explicitly.

## Reporting a vulnerability

Do not publish exploit details in a public issue.

Prefer GitHub's private vulnerability reporting / Security Advisory flow for this repository. If private reporting is unavailable, open a minimal public issue stating that you need a private security contact, without including reproduction steps, payloads, credentials, printer addresses, customer data, or exploit details.

Please include privately, when available:

- affected OpenReceipt version or commit
- runtime and operating system
- transport involved (for example TCP or USB)
- affected printer/profile
- impact
- minimal reproduction
- whether the issue can be triggered remotely

## Security principles

OpenReceipt should:

- never require application secrets to be embedded in receipt templates
- never log receipt contents, credentials, printer addresses, or sensitive payloads by default
- validate untrusted configuration before opening a transport
- use explicit timeouts for network operations
- avoid shell execution for normal printing paths
- avoid silently escalating device or operating-system permissions
- keep protocol encoding separate from transports
- preserve useful low-level error causes without exposing sensitive values in user-facing messages
- treat printer responses and external input as untrusted data
- keep dependencies minimal and review security-sensitive dependency changes carefully

## Hardware safety and compatibility

Printer compatibility claims must be evidence-based. A compatible protocol does not guarantee that every model safely supports every command.

Potentially disruptive actions such as cash-drawer pulses, paper cuts, device resets, firmware-specific commands, or future raw-command escape hatches must be explicit and capability-aware.

OpenReceipt must not claim universal hardware support where behavior has not been tested or documented.
