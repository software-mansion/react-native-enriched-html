# Stage 4 — Device testing with Argent

## Prerequisites

- Argent must be available: its MCP tools (`list-devices`, `gesture-tap`, ...) are exposed to
  you, or `command -v argent` succeeds.
  If it isn't, tell the user once:
  > Argent isn't installed. Run `npx @swmansion/argent@latest init -y` to enable device testing.

  Then finish stages 1–3 and return `CHANGES_REQUESTED` with a "device validation blocked"
  finding for UI-affecting changes.
- Before the first device call, read the `argent-device-interact` and
  `argent-react-native-app-workflow` skills (installed by `argent init` next to this skill), and
  any project Argent rules your agent loaded (e.g. `.claude/rules/argent.md`).

## Project facts

- Example app: `apps/example`, bundle id / applicationId `swmansion.enriched.example`.
- Metro: `yarn example start` (port 8081). Start it in the background only if it isn't running.
- iOS build: `yarn example ios --udid <UDID>`; after adding/removing native iOS files run
  `bundle exec pod install` in `apps/example/ios` first.
- Android build: `yarn example android --device <serial>`.
- Web example: `yarn example-web dev` (Vite).

## Procedure

1. `list-devices`; reuse booted devices. Test **every native platform the change can affect**
   (iOS and Android unless `--platform` narrows it or the change is web-only). Boot a device if a
   needed platform has none. Devices share Metro — test one platform at a time.
2. Make sure the installed build contains the change: native files changed → rebuild; JS-only →
   `debugger-reload-metro`. If you can't tell, rebuild.
3. Per platform:
   - reproduce the intended behaviour (for a bug fix: the original bug's steps, now fixed);
   - at least **two edge cases of your own** aimed at the riskiest parts of the diff (pick from
     [code-review.md](code-review.md));
   - tap targets come from the accessibility tree / `debugger-component-tree`, never from
     screenshot pixels;
   - screenshot the key states; check `debugger-log-registry` for errors and warnings;
   - where HTML output matters, read it (example app HTML preview, or `debugger-evaluate`)
     instead of judging from pixels.
4. **Cross-platform comparison:** run the same scenario on each platform and compare the visible
   result and the HTML. Differences go into the parity table ([parity.md](parity.md)).
5. Web: if `src/web/**` changed or the parity table says web must match, run the web example and
   drive it through Argent's Chromium support when a CDP browser is available. Otherwise state
   that web was checked statically only.
6. If a device can't be brought up, report "device validation blocked on <platform>" — don't
   approve on static review alone.

## Cleanup

- Leave simulator servers running — the next task reuses them. Stop them
  (`stop-all-simulator-servers` with `devices: [...]` naming only the devices you used) only if
  the user asks to clean up or ends the session.
- Never stop a Metro the user started unless they ask.
