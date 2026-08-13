// ── Access rules ──
// Quizzes and Full 100 require an account (enforced where each page checks
// `user` from useAuth), but there is currently no paid tier — everything a
// signed-up user can reach is unlocked. Mock tests and the exam calendar
// need no account at all (enforced in Mock.jsx / Exams.jsx).
//
// A real paid cutoff may be introduced later once a date is decided — when
// that happens, reintroduce a dated gate here rather than hardcoding a date
// in any page.
