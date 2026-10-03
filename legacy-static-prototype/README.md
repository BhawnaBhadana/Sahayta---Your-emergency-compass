# Legacy static prototype

This folder holds the original static HTML/Tailwind prototype that Sahayta started from
(scaffolded by the "rocket.new" builder tool). It has been fully superseded by the
`frontend/` (React) + `backend/` (Node/Express + PostgreSQL) application at the project
root, which implements the same ideas properly wired to a real backend, plus everything
described in the root `README.md`.

It's kept here for reference rather than deleted. Known issues in this version that the
rewrite fixes: two disconnected auth systems (localStorage/JWT vs. an unconfigured Firebase
admin panel), inconsistent `/api/resources` response shapes expected across pages, several
broken internal links from filename typos, and an orphaned unrelated page
(`learning-engine.html`, a spaced-repetition study tool with no connection to Sahayta).
