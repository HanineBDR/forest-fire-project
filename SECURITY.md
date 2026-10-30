# Security Policy — INKAD Platform (إنقاذ)

## Overview

The **INKAD** platform simulates a national-scale command and early warning infrastructure for forest fire prediction, detection, and emergency inter-agency coordination in Northern Algeria.

Because the system manages critical operational data—including live NASA FIRMS thermal hotspots, real-time Civil Protection deployment logs, and citizen emergency reports—we treat platform security, access control, and vulnerability management with the highest priority.

---

## Supported Versions

Only the latest active minor release is officially supported with security updates and patches:

| Version | Supported | Status |
| :--- | :---: | :--- |
| `3.x` (Current) | :white_check_mark: | Active support & continuous security patches |
| `2.x` | :x: | End of Life (Deprecated) |
| `< 2.0` | :x: | Unsupported |

---

## Reporting a Vulnerability

> **CRITICAL**: If you discover a security vulnerability, **please DO NOT open a public GitHub issue, discussion, or pull request.** Public disclosure exposes emergency operations simulations to potential abuse.

Instead, please report vulnerabilities privately using one of the following methods:

1. **Email the Security Team**:
   - Primary: [security@in9ad.dz](mailto:security@in9ad.dz)
   - Secondary / Academic Maintainer: [hanine.boudour@univ-constantine2.dz](mailto:hanine.boudour@univ-constantine2.dz)

2. **GitHub Private Security Advisory**:
   - If available on your fork or repository permissions, use the **"Report a vulnerability"** button under the repository's [Security Advisories](../../security/advisories/new) tab.

---

## What to Include in Your Report

To help us triage and remediate the issue rapidly, please provide:

- **Type of vulnerability** (e.g., Broken Access Control, Authentication Bypass, Injection, Sensitive Data Exposure, CORS Misconfiguration, Insecure Deserialization).
- **Affected component(s)**: Exact frontend route, backend endpoint, or data processing script (e.g., `/auth/create-user`, `backend/app/routers/predict.py`).
- **Step-by-step reproduction instructions**: A minimal proof of concept (PoC) or script demonstrating the vulnerability.
- **Impact assessment**: The potential consequences for operational responders, citizen privacy, or system availability.
- **Mitigation suggestions**: If you have identified a viable patch or architectural fix.

---

## Vulnerability Handling SLA & Response Timeline

When a report is received, the maintenance team commits to the following timeline:

| Phase | Target Timeline | Details |
| :--- | :--- | :--- |
| **Initial Acknowledgment** | Within **48 hours** | Confirming receipt and assigning a triage engineer |
| **Preliminary Assessment** | Within **5 business days** | Reproducing the issue and evaluating threat severity |
| **Patch Development** | Within **14 business days** | Developing, testing, and verifying a secure fix |
| **Public Advisory & Release**| Following patch deployment | Publishing coordinated release notes and crediting the researcher |

---

## Security Architecture & Best Practices

Contributors and operators should adhere to the following core security principles:

1. **Role-Based Access Control (RBAC)**:
   - Backend endpoints enforcing administrative or dispatch actions MUST validate the JWT bearer token and enforce user roles (`CIVIL_PROTECTION`, `FOREST_GUARD`, `ADMIN`).
   - Frontend route gating via `RoleGate` is a UI convenience; backend authorization is the authoritative security boundary.

2. **Citizen Reporting & Media Upload Sanitization**:
   - Community-submitted images undergo automatic mime-type validation and face/privacy checks before being surfaced in operational queues.
   - Uploaded assets must never execute server-side code.

3. **Credential Management**:
   - Secret keys, API tokens (NASA FIRMS, Open-Meteo, JWT secret keys), and database connection strings MUST be stored in `.env` or system environment variables, never hardcoded in source control.

4. **Input Sanitization & Injection Prevention**:
   - All database interactions with SQLite/PostgreSQL utilize parameterized queries or ORM models to eliminate SQL injection risks.
   - User inputs in reports, intercom messages, and audit notes are strictly escaped against cross-site scripting (XSS).

---

## Attribution & Acknowledgments

We deeply appreciate security researchers, Thirduni mentors, and peer developers who responsibly disclose vulnerabilities to keep INKAD robust and trustworthy. Contributors who submit verified security reports will be acknowledged in our release notes (unless anonymity is requested).

