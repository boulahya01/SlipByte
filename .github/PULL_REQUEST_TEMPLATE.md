## Summary

Describe what changed and why.

## Problem solved

What developer or maintainer problem does this change address?

## Validation

- [ ] `npm run check` passes
- [ ] tests cover new behavior or explain why tests are not needed
- [ ] public API changes are documented
- [ ] errors remain structured and actionable
- [ ] no secrets, credentials, private receipt data, or sensitive diagnostics are included

## Architecture check

- [ ] receipt intent is not coupled to transport code
- [ ] protocol encoding is not coupled to sockets / USB / OS queues
- [ ] application-facing behavior is capability-driven rather than brand-driven
- [ ] hardware-specific behavior is isolated and documented

## Compatibility

If this changes printer behavior, list exact printer models / firmware tested. Do not claim compatibility based only on brand or protocol family.

## AI-agent usability

For public API changes, could a coding agent understand correct usage, defaults, failures, and constraints from types and documentation without reading implementation internals?
