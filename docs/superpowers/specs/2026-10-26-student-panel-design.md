# AYDA Student Panel — Live Data Design
Date: 2026-10-26

## Intent
Replace the synthetic student preview with a read-only AYDA student portal that shows each authenticated learner their active group, assigned work, attendance history, next scheduled lesson, course end date, and learning links.

## Data and access
- Use current Apps Script Sheets: OGRENCILER, GRUPLAR, HAFTALIK_PROGRAM, YOKLAMA, ODEV_TAKIBI, DERS_ODEVLERI, and ODEV_GOREVLERI.
- Do not add a Sheet or password column.
- The admin provisions an individual starter password from the existing student card. Store only a SHA-256 verifier in Script Properties and show the generated password once for manual delivery.
- Student sessions are random, short-lived cache tokens. Every dashboard request resolves the token to one active student, then filters returned records by that student's current group and student ID.
- Never return staff notes or other students' rows.

## Student view
- Real login uses the student number and generated password.
- Current week: class assignment text and active dated tasks, with missing checks highlighted.
- Missed work: recorded Yapmadı entries and overdue active dated tasks.
- Attendance: personal attendance history with excused absences clearly marked.
- Course end date comes from GRUPLAR.Planlanan Bitiş. If blank, show that it is unspecified.
- Next lesson comes from the active weekly schedule in Europe/Istanbul time. Do not invent a topic.
- Keep AYDA learning portal and lesson replay links. Hide invalid WhatsApp links.

## Scope boundaries
Read-only for students. No homework submission, attendance edits, payments, staff notes, SSO, or changes to the other student sites. No production publication until the current Apps Script version is published and one student account is used for end-to-end verification.
