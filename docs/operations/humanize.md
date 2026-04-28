# Humanize Operations

## Installed Location

Updated Humanize source is cloned locally at:

```text
/Users/gs2ygc/local-tools/humanize
```

Codex skills/runtime are installed into:

```text
/Users/gs2ygc/.codex/skills/humanize
```

The native Codex Stop hook is installed at:

```text
/Users/gs2ygc/.codex/hooks.json
```

## Update / Reinstall

```bash
git -C /Users/gs2ygc/local-tools/humanize checkout dev
git -C /Users/gs2ygc/local-tools/humanize pull --ff-only origin dev
cd /Users/gs2ygc/local-tools/humanize
./scripts/install-skills-codex.sh
```

## Current Defaults

The installed Humanize dev version uses these defaults:

```text
codex_model: gpt-5.5
codex_effort: high
```

Start RLCR without passing `--codex-model` when the desired default is `gpt-5.5:high`:

```bash
"/Users/gs2ygc/.codex/skills/humanize/scripts/setup-rlcr-loop.sh" docs/plan.md \
  --base-branch main \
  --max 20 \
  --track-plan-file
```

Override only when needed:

```bash
"/Users/gs2ygc/.codex/skills/humanize/scripts/setup-rlcr-loop.sh" docs/plan.md \
  --base-branch main \
  --codex-model gpt-5.5:medium \
  --max 20 \
  --track-plan-file
```

## Side Work In The Same Repo

When an RLCR loop is active, Humanize's native Codex Stop hook watches the repository and may gate normal Codex exits. This is useful for implementation rounds but can be annoying for unrelated side work in the same repo.

For Codex CLI side work, prefer starting a separate Codex session with hooks disabled:

```bash
codex --disable codex_hooks -C /Users/gs2ygc/SeoBlogerAgent
```

Equivalent config override:

```bash
codex -c features.codex_hooks=false -C /Users/gs2ygc/SeoBlogerAgent
```

For one-shot Codex exec side work:

```bash
codex exec --disable codex_hooks -C /Users/gs2ygc/SeoBlogerAgent "do the side task"
```

Note: `--plugin-dir /path/to/humanize` appears in Humanize's Claude documentation. Current Codex CLI help on this machine does not expose a `--plugin-dir` option, so use `--disable codex_hooks` for Codex side sessions.

## Cancel Active Loop

```bash
"/Users/gs2ygc/.codex/skills/humanize/scripts/cancel-rlcr-loop.sh" --force
```
