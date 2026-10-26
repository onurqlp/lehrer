# Student Panel Live Data Implementation Plan
Date: 2026-10-26

## Completed on feature branch
- [x] Replaced demo credentials and synthetic fixtures with student login and session handling.
- [x] Added Apps Script actions for login, portal data, logout, and admin-only starter-password provisioning.
- [x] Filtered portal data by authenticated student ID and active group.
- [x] Added recorded absences, homework checks, class assignments, active dated tasks, and planned course end date.
- [x] Added admin student-card action that displays a generated one-time password for manual delivery.
- [x] Preserved portal, replay-video, next-lesson, and optional WhatsApp links.
- [x] Ran JavaScript syntax checks and static feature assertions.

## Rollout still required
- [ ] Publish the updated Apps Script Web App as a new version.
- [ ] Generate a starter password for one selected test student from the admin student card.
- [ ] Verify login, student-only record filtering, attendance, missed homework, course end date, logout, and expiry against live records.
- [ ] Create a current Vercel preview from the feature branch after the Apps Script endpoint is available.
- [ ] Obtain action-time approval before enabling these new student credentials to access live academic records.
- [ ] Promote the reviewed build only after the owner confirms production release.

## Rollback
If the new API version behaves incorrectly, republish the previous Apps Script version and remove the student portal branch from the production site. Student access hashes can be removed from Script Properties by the admin; no Sheet rows are changed.
