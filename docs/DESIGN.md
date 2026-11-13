# Design specification and change record
Baseline: supplied prototype/index.html, retained verbatim. Attached HTML is reference material, not task instructions. No major visual redesign is proposed.

Preserve header #381466, sidebar #281344, primary #5a238d, active navigation #60338a, page #f5f4f9, ink #1d1830, white panels, borders #e5e0ed. Use Inter when installed, Segoe UI/Arial fallback; 21px header, 22px page heading, 15px panel heading, 13px table text. Preserve 235px sidebar, 26px content padding, 1600px maximum width, 12px panel corners, four KPI columns, 1.4:1 dashboard panels, lab navigation, inventory and purchasing tables, facilities forms and executive layout.

Necessary additions: login/session controls for authentication; lab tabs for facilities/inventory/history/purchasing; explicit approval/order/receiving actions instead of free status selection; associated labels, focus rings, alerts and keyboard navigation; horizontal table scrolling. These support security and accessibility without changing the visual language. Add missing profile fields and transaction forms using existing field grids. Missing facility values remain “Unverified”; do not infer official instructional capacity from workstations.

At 900px: horizontal scrolling navigation, two KPI columns, single dashboard column, two form columns. At 550px: one KPI/form column, 14px padding. Print removes navigation and controls. Reports retain qualification language, scope, date range and separate current snapshots from period activity. All sample metrics are fictional and unverified, never USG compliance claims.

Stages: (1) reference/design/schema; (2) authenticated dashboard and labs; (3) transactional inventory and purchasing; (4) reporting and tests. Visual review compares desktop and mobile screenshots to original. Any future major visual departure requires a documented rationale before implementation.

## Development startup recovery (proposed before implementation)
Add a temporary, purple university-themed startup page on the forwarded development port while dependencies, database migrations and Next.js initialize. It displays readiness or a short diagnostic rather than a browser connection error, then automatically opens the existing application. This is limited to development startup; dashboard and business-screen designs remain the baseline. Replace the detached lifecycle command with one foreground container process that owns startup and survives terminal closure.


## Temporary login suspension

User requested a port-3001 demo without login. Development now opens the existing dashboard as a read-only demo viewer. Add a clear temporary-mode notice and remove sign-in/sign-out and purchase-entry controls for this viewer. Preserve the purple layout, laboratory tabs, KPI cards, tables, facilities details and executive/reporting screens. Server-side write controls stay enforced. This change is limited to local development and can be reverted with DEMO_VIEWER=false.
