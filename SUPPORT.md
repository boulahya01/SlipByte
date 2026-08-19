# Support

SlipByte is an open-source developer tool. The project aims to make thermal printing easier, but printer hardware, operating systems, drivers, firmware, and ESC/POS-compatible implementations vary widely.

## Before opening an issue

Please include enough information to reproduce the problem:

- SlipByte version or commit
- Node.js version
- operating system
- printer manufacturer and exact model
- connection type (TCP, USB, serial, OS queue, etc.)
- minimal code sample
- expected result
- actual result
- relevant error code and sanitized diagnostics

Do not include customer receipts, credentials, private IPs that should remain secret, access tokens, or other sensitive data.

## What we can support

We can investigate behavior that belongs to SlipByte, such as:

- receipt layout
- protocol encoding
- supported transports
- documented printer profiles
- structured errors and diagnostics
- preview/mock behavior
- documented text and RTL behavior

## What may be outside project control

Some failures originate from:

- vendor drivers
- operating-system printer configuration
- unsupported or undocumented firmware behavior
- damaged or misconfigured hardware
- network/firewall policies
- nonstandard ESC/POS implementations

We will still try to make failures understandable, but we cannot guarantee fixes for behavior controlled entirely by third-party hardware or software.

## Compatibility reports

Reports from real printers are valuable. When reporting successful or unsuccessful compatibility, include the exact model and firmware version when possible. Compatibility should never be inferred from brand name alone.
