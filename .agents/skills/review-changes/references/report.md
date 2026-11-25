# Final report

Your final message, exactly this shape:

```
## Verdict: APPROVE | CHANGES_REQUESTED

Target: <what was reviewed>
Intent: <one sentence>

## Findings
1. [blocker|major|minor] path:line — what's wrong. Evidence / repro. Suggested fix.
(or "None")

## Platform parity
| Behaviour | iOS | Android | Web | Notes |
| --- | --- | --- | --- | --- |
| <behaviour> | ✅ code+device | ❌ missing | ➖ n/a (compatibility.mdx) | ... |

## Device testing
- <platform> / <device>: intent reproduced yes/no
  - edge case: <case> → <result>
  - edge case: <case> → <result>
- Cross-platform comparison: same | differs: <how>
- Screenshots: <paths>
- Logs: clean | <errors>

## Static checks
- <command>: pass | fail (<first error>)
```

Keep findings ordered most severe first. Every `major`/`blocker` needs evidence: a file:line, a
failing command, or a device repro.
