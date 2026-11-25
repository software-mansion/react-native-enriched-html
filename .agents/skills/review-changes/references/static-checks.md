# Stage 2 — Static checks

Run the checks that match the touched files (all of them if unsure). Run slow ones in the
background. Report each as pass / fail, quoting the first error verbatim.

| Touched | Command |
| --- | --- |
| anything | `yarn typecheck`, `yarn lint`, `yarn test` |
| `ios/**` (`.h`, `.m`, `.mm`) | `yarn lint-clang:ios` |
| `android/**` (`.kt`, `.java`) | `yarn lint:android` |
| `android/**` (`.h`, `.cpp`) | `yarn lint-clang:android` |
| `cpp/**` | `yarn lint-clang`; build and run `cpp/tests` if the parser changed |
| `docs/**` | `yarn typecheck:docs` |

A failing check is a `major` finding (a `blocker` if it is a typecheck/build failure). Don't run
`*:fix` variants — they modify the tree.
