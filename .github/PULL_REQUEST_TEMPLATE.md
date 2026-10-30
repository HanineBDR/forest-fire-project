## Description of Changes

A clear, concise summary of what this Pull Request addresses, fixes, or implements.

---

## Related Issue(s)

Closes #
Fixes #
Related to #

---

## Type of Change

Please mark the options that are relevant to this PR:

- [ ] **Bug fix** (non-breaking change fixing an issue or visual contrast regression)
- [ ] **New feature** (non-breaking change adding operational functionality or map layers)
- [ ] **AI / ML model update** (calibration, retrained XGBoost model, or FWI index adjustment)
- [ ] **Refactoring / Performance** (code restructuring, bundle size optimization, query speedup)
- [ ] **Documentation** (updates to architectural docs, guides, or API specifications)
- [ ] **Internationalization (i18n)** (translation updates or RTL layout corrections)

---

## Verification & Testing Checklist

Please review and check off all applicable items before requesting review:

- [ ] **I have tested my code locally**: Verified that frontend (`npm run dev`) and backend (`uvicorn main:app`) build and operate correctly.
- [ ] **No new TypeScript errors**: Executed `cd frontend && npx tsc --noEmit` and confirmed **0 type errors**.
- [ ] **I have updated the translations (EN, FR, AR)**: All user-facing strings are present in `en.json`, `fr.json`, and `ar.json` (as well as their matching `.ts` dictionaries).
- [ ] **Dual-Theme contrast validated**: Verified that text, cards, borders, tooltips, and map layers render with high contrast (WCAG AA compliant) in **both Dark Mode and Light Mode**.
- [ ] **Role-Based Access Control (RBAC) intact**: Verified that permissions for Civil Protection, Forest Guards, and Central Administration function as expected without unauthorized access.
- [ ] **Responsive Design verified**: Checked desktop (1920x1080), laptop, tablet, and mobile viewport layouts.
- [ ] **Documentation updated for new AI features**: If updating ML models, documented accuracy, ROC-AUC, confusion matrix, or data schemas.

---

## Visual Proof & Screenshots

| Before Change | After Change |
| :---: | :---: |
| *(Attach screenshot / recording)* | *(Attach screenshot / recording)* |

---

## Operational Notes for Mentors & Reviewers

Provide any context, edge cases tested, or instructions on how to test this feature locally.

