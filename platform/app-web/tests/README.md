# WebUI Test Notes

This directory now holds lightweight frontend behavior tests for pure trust-cue
helpers.

The current harness intentionally starts small: it validates operator-facing
topology trust-language mapping without pulling business logic into the frontend
or duplicating backend contract tests.

Run the current tests with:

- `npm test`

The repo-owned image build and topology redeploy flow remains the primary
validation path for routine platform changes.
