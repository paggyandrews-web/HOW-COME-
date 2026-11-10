// ── Access rules ──
// Every feature needs an account EXCEPT the exam calendar (Exams.jsx) and the
// Home / Profile / Login / Register pages. Signed-out visitors get the
// SignupGate (or an inline sign-up box on Full 100). Sign-up links carry
// `state.from`, so after signing up the person lands back on the page they
// opened (e.g. a paper link shared on Telegram).
//
// There is currently no paid tier — everything a signed-up user can reach is
// unlocked. If a paid cutoff is introduced later, add a dated gate here rather
// than hardcoding a date in any page.
