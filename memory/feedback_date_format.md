---
name: feedback_date_format
description: All datetime strings sent to the API must use yyyy-MM-dd HH:mm:ss format, never ISO 8601
metadata:
  type: feedback
---

Always format dates as `yyyy-MM-dd HH:mm:ss` when sending to the backbone-rest API (e.g. `dateTime` field in request bodies).

**Why:** The backend expects this format. ISO 8601 (`toISOString()`) is wrong here.

**How to apply:** Use a local `formatLocalDate(d: Date)` helper (already present in `application-form.component.ts`) or an equivalent formatter. Never pass `new Date().toISOString()` to API request bodies in this project.
