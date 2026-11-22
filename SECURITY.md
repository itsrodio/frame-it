# Security Policy

## Supported Versions

Security fixes are applied to the latest active release of FrameIt:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| < 0.4   | :x:                |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report vulnerabilities privately via GitHub Security Advisories:
https://github.com/itsrodio/frame-it/security/advisories/new

Include as much information as possible to help reproduce and assess the issue:

- Affected version and browser
- Steps to reproduce or proof of concept
- Potential impact

We aim to acknowledge reports within 72 hours and provide a fix or mitigation plan as soon as possible.

## Security Architecture

- FrameIt runs 100% locally in your browser with zero telemetry or external data transmission.
- Extension UI is rendered inside an isolated Shadow DOM container to avoid interfering with host page scripts or styles.
- Content scripts only run on the active tab when explicitly triggered via the browser toolbar action.
