---
name: verify-mvp
description: Verify Floria MVP against production and Monday demo checklists.
---
1. Read docs/09-DEFINITION-OF-DONE.md and docs/10-MONDAY-DEMO.md.
2. Start app.
3. Run lint/typecheck/tests.
4. Run Playwright/browser checks.
5. Verify role isolation.
6. Verify stock/price revalidation.
7. Verify payment webhook idempotency if enabled.
8. Inspect mobile and desktop layouts.
9. Produce PASS/FAIL/BLOCKED checklist.
10. Turn every FAIL into a concrete next task.
