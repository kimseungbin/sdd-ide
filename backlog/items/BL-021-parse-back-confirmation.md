---
id: BL-021
title: Parse-back path — RETIRED (superseded by D30)
status: deferred
type: feature
priority: low
milestone: M2
depends-on-hard: []
depends-on-soft: []
decisions: [D30]
---

## Intent

**Retired by D30.** Parse-back existed only to reconcile a reviewer's hand-edit of the committed
markdown projection back into the store (former D14/O18). With the spec store externalized to
SQLite (D30) there is no committed text projection and no text→store path at all — so this item
has no reason to exist. Kept as a tombstone for traceability.

## Acceptance criteria

- [x] N/A — retired. No parse-back surface exists in the externalized model.

## Notes / open questions

- Spec review is now app-native (D13 #1 reworked), rendered from store history — see [[BL-061]].
