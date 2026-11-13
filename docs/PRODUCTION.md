# Institutional review and production gates

These are proposed approval owners and work items; MGA must confirm the actual process. No approval has been claimed.

- School of Computing system owner: scope, stewardship, role/assignment matrix, separation of duties, acceptance testing and verified inventory/facilities baseline.
- MGA Information Technology and Information Security: architecture/threat review, penetration testing, dependency review, secure hosting/network design, TLS, secret management, vulnerability handling, incident response and operational ownership.
- Identity/access management: approved SSO/MFA integration, session policies, account provisioning/deprovisioning, password/account recovery and access recertification. Current local passwords are for development; there is no SSO, MFA or recovery flow.
- Procurement, Finance and fixed-asset accounting: approval thresholds, funding codes, purchase-order authority, receiving controls, cost reconciliation, asset valuation and approved financial-system interfaces. Current workflows do not substitute for university purchasing authority.
- Facilities and safety offices: verified building/room identifiers, square footage, approved occupancy, instructional capacity, and workstation status. Demonstration values are fictional.
- Institutional research/leadership and appropriate USG reporting owner: validated definitions, reporting calendars, metric lineage, export formats and any formal compliance claims. No USG certification is included.
- Accessibility office: formal WCAG 2.2 AA evaluation, assistive technology testing, keyboard navigation and tagged/accessible PDF review. Current PDFs are printable reports, not tagged accessible PDFs; Excel or HTML is available for structured reading.
- Privacy, records management and legal: personnel/contact data classification, applicable student/privacy requirements, audit retention, export/download policy, records disposal and vendor terms.
- Database/operations administrators: managed PostgreSQL, least privilege review, encryption at rest/in transit, tested backups and restoration, RPO/RTO, schema change/rollback process, audit retention, monitoring and incident runbooks.

Known production work: approved identity integration and recovery; separate migration-only/production bootstrap flow; durable login throttling operations and expired-session cleanup; organization-specific finance rules and vendor/funding master data; verified calendar configuration; monitoring and backup restoration drills; load/security/accessibility review and approved PDF accessibility approach. Local authentication uses bcrypt, opaque eight-hour HttpOnly sessions, SameSite cookies, origin checks, and per-account login throttling. RLS and server authorization are active. A database superuser can administer the database and must be operationally controlled; immutable application audit is not external tamper-proof archival storage.
