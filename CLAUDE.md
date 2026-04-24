# dark_monkey_app — Agent Playbook

> Project-specific rules. Top-level `/Users/paulolopes/Desktop/lopes2tech/CLAUDE.md` still applies.

## Preview / verification

- **Never run `preview_start`.** The user always runs `npm run dev` on port 3000 themselves.
- **Verification:** `npx tsc --noEmit` only. No browser. No screenshots.

## TODO — fill in as landmines surface

- [ ] Stack summary (framework, DB, auth, billing)
- [ ] Build / CI gotchas
- [ ] Any module-scope code that touches env vars (lazy-init instead)
- [ ] Deployment target + branch
- [ ] Known fragile areas

## Update this file

When you discover a non-obvious behavior or footgun, add it here. Bug found once should not bite twice.
