## v1.0.9 — Bulk Student Import

Teachers can now import students from `.xlsx` and `.xls` spreadsheets.

The importer reads only:

- First Name
- Last Name
- Class

Additional spreadsheet columns are ignored. The workflow includes column detection, preview, validation, invalid-class reporting, duplicate detection, database error reporting, and an import summary.

The desktop application can receive this update through the existing GitHub Release and Electron auto-update mechanism.