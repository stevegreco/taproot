# Taproot usage evals

These evals measure whether agents do better work with the Taproot spec tools than without them.
Each task runs in three setups, with the same model:

| Variant | Setup | What the agent has |
| --- | --- | --- |
| `baseline` | No spec tools (control) | Nothing extra |
| `v1` | CLI | Bash, limited to `node_modules/.bin/taproot` |
| `v2` | MCP | The taproot MCP server |

The evals call a model, so they cost usage. They run only when someone starts them, never in
`pnpm test`.

## The two suites

- **Answer suite** (default): the agent answers a design system question, such as which component
  fits, and ends with a line of JSON. It is graded on that JSON. The questions are in
  `cases.json`, and `cases.md` lists them for review. The agent has no file tools.
  The `review` cases show code from a past bug fix and ask which MUST rule it breaks. Each bug case
  has a one-sentence `answer_key` and the commit it came from (`from`), and only the rule the fix
  restored counts. Each has a control: the fixed code, where the right answer is no rule, so an
  agent that flags everything scores no better than one that flags nothing.
- **Build suite** (`TAPROOT_EVAL_SUITE=build`): the agent builds a page with the web components and
  writes `index.html`. The grade checks that HTML: the expected components; attributes, values, and
  slots against the package's `custom-elements.json`; the MUST rules a script can check;
  task-specific checks; and that the page loads the packages. Every setup gets the same file tools
  (Read, Write, Edit, Glob, Grep). The tasks are in `build-cases.json`.

## Files

| File | What it does |
| --- | --- |
| `run-eval.mjs` | The runner: runs each case, grades it, writes results and transcripts. |
| `taproot-case.mjs` | The answer suite: setups, the `claude -p` call, grading. |
| `build-case.mjs` | The build suite: a fresh workspace per run, the HTML grader. |
| `setup-project.mjs` | Builds the throwaway project the agents work in, from the packed packages. |
| `check-cases.mjs` | Checks every expected answer in `cases.json` against the current spec and rewrites `cases.md`. Calls no model. |
| `summarize-build.mjs` | Prints the build suite's results as Markdown tables. |
| `runs/` | The answer suite's results. |
| `build-runs/` | The build suite's results. |

## Before a run

1. Build the packages: `pnpm build`.
2. Have the `claude` CLI installed and signed in. The agents run through `claude -p` with your
   account. If `ANTHROPIC_API_KEY` is set, it is passed through.
3. For the build suite, install the browser the grader uses to parse pages:
   `pnpm exec playwright install chromium`.
4. Build the eval project. It installs the packed packages outside the repository, so the agents
   cannot read the source:

```bash
node evals/taproot-usage/setup-project.mjs
```

Run it again after changing a package, so the agents see the change.

## Run

Run each variant from the repository root. Answer suite:

```bash
node evals/taproot-usage/run-eval.mjs --flow evals/taproot-usage/runs --variant baseline
```

Build suite:

```bash
TAPROOT_EVAL_SUITE=build node evals/taproot-usage/run-eval.mjs --flow evals/taproot-usage/build-runs --variant baseline
```

Then repeat with `--variant v1` and `--variant v2`.

Options:

- `--model <id>`: the model. The default is `claude-haiku-5-5`, to keep runs cheap. The first build
  run used `claude-opus-5-5` at about $0.30 to $0.60 per task and setup. Compare runs only within
  one model.
- `--reps <n>`: runs per task. The default is 1.
- `--concurrency <n>`: runs at once. The default is 4.
- `--timeout-s <n>`: the ceiling per run, in seconds.
- `TAPROOT_EVAL_CASES=id1,id2`: run only these cases, for a pilot.
- `TAPROOT_EVAL_PROJECT`: where the eval project is, when it is not the default temporary folder.
- `TAPROOT_EVAL_CLAUDE`: the `claude` binary to use.

Try one case in one setup before a full run:

```bash
TAPROOT_EVAL_SUITE=build TAPROOT_EVAL_CASES=build-address-form node evals/taproot-usage/run-eval.mjs --flow evals/taproot-usage/build-runs --variant v1
```

## Results

Each variant folder holds `results.jsonl`, with one row per run: the grade, an explanation of each
failed check, time, tool calls, tokens, and cost. Its `traces/` folder holds each full transcript,
and in the build suite the transcript ends with the page the agent wrote. Read the transcripts, not
only the scores. They show where agents skipped the tools, read package files, or wasted calls.

The runner resumes: a case already in `results.jsonl` is skipped. To start a fresh run, use a new
`--flow` folder, and copy `_state.json` into it from the suite's folder.

For the build suite, print the tables:

```bash
node evals/taproot-usage/summarize-build.mjs [flow-folder]
```

The answer suite has no summary script in the repository. `runs/report.html` was made with an
outside tool.

Write up a run that leads to decisions as a dated report in `docs/reviews/`, and fix or file each
finding. [`docs/reviews/2026-11-17-spec-tools-build-eval.md`](../../docs/reviews/2026-11-17-spec-tools-build-eval.md)
is the first one.

## The harness check

Each flow's `_state.json` records a hash of the harness: `run-eval.mjs`, the lockfile, and the files
in its `harness_paths`. The runner refuses to start when the harness has changed since that hash
was recorded, so a changed grader or task list is not run without review. After reviewing a change,
add `--approve-harness` to the next run, which records the new hash. A run with nothing left to do
records the hash without calling a model.
