// ─────────────────────────────────────────────────────────────────────────
//  PSC EXAM CALENDAR — GOOGLE SHEET LINK
//
//  New exams are typed into a Google Sheet, not into code. The app reads the
//  sheet's "Publish to web → CSV" link below every time it opens, and shows
//  those exams together with the ones already saved in exams.json.
//
//  To change the sheet: Google Sheets → File → Share → Publish to web →
//  choose the "Exams" tab → CSV → Publish → copy the link and paste it here.
//  Leave it as '' to turn the sheet off (the app then shows exams.json only).
// ─────────────────────────────────────────────────────────────────────────
export const EXAM_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4B2RAZN74wHBc5kIsZalMa6QWJlN6gAWoAnRzwzYnz1sFuWOX-9AJOlcETW3UKvLS2vS8VJ9rnQ8o/pub?gid=0&single=true&output=csv'
