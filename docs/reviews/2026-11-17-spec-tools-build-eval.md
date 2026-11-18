# Do the spec tools help agents build UI? (2026-11-17)

The first run of the build eval asked for in #261. Six page-building tasks, each run once by the
same model under three setups: no spec tools, the CLI, and the MCP server.

**Short answer:** every setup built every page correctly, so this run cannot show that the spec
tools make pages more correct. They did make agents about twice as fast and half as costly: the
agents without them read the package files to work out the same facts. The tasks need to be harder
before the eval can show a difference in correctness (#357).

## What was run

- **Tasks:** `evals/taproot-usage/build-cases.json`. Each asks for a page in plain product terms,
  without naming components: account settings with a delete confirmation, a checkout shipping
  step, notification settings, a project page with views, a form after a failed save, and an
  address form.
- **Setups:** every agent gets the same file tools (Read, Write, Edit, Glob, Grep) in a project
  with the packed `@taproot-ds/tokens`, `@taproot-ds/web-components`, and `@taproot-ds/spec`
  installed. The CLI setup adds Bash limited to `node_modules/.bin/taproot`. The MCP setup adds
  the taproot MCP server.
- **Model:** `claude-opus-5-5`, medium effort, through `claude -p`. One run per task and setup.
- **Grading:** `evals/taproot-usage/build-case.mjs` parses the page the agent wrote and checks:
  - **components:** the expected Taproot elements are there;
  - **api:** every attribute, value, and slot on a `ds-` element is in the package's
    `custom-elements.json`;
  - **rules:** the MUST rules a script can check (form controls have labels, buttons have names,
    dialogs have a title and a button, tabs and alerts have text, choices have options);
  - **task:** checks for that task, such as a destructive Delete account button or a link, not a
    button, back to the projects list;
  - **setup:** the page loads the web components and the token stylesheet.

## Results

| Metric | No spec tools | CLI | MCP |
| --- | --- | --- | --- |
| Correct (all checks) | 6/6 | 6/6 | 6/6 |
| Median time (s) | 63 | 37 | 37 |
| Median tokens | 436k | 193k | 271k |
| Median tool calls | 25 | 11 | 18 |
| Mean cost ($) | 0.60 | 0.32 | 0.37 |

The first grading failed one no-tools page for `autofocus` on a dialog button. The Dialog web
docs tell consumers to use it, so that was a grader bug. The grader now accepts it, and every
saved page was graded again without rerunning the agents.

| Transcript count, all six tasks | No spec tools | CLI | MCP |
| --- | --- | --- | --- |
| Calls that read package files | 41 | 31 | 20 |
| Spec tool calls | 0 | 26 | 45 |
| Calls using `batch` | 0 | 11 | 0 |
| Reads of saved tool output | 0 | 3 | 0 |
| Failed tool calls | 0 | 7 | 0 |

## What the transcripts show

1. **Without the spec tools, agents read the package to learn the same things.** They globbed
   for the packages, then read `implementation/<name>.md` and the component source. Those files
   ship in the web components package, which is why the no-tools pages were still right. That
   took twice the calls and tokens. *Filed with the next point in #357.*
2. **The tasks are too easy to separate the setups.** No task caught a guess. The `danger` and
   `destructive` variant mix-up, for example, never happened. *Filed: #357* (harder tasks, three
   runs per task).
3. **Every setup went to the package files for the same two facts: the font links and the
   no-bundler entry file.** `setup --impl web` pointed to the tokens readme for fonts and said
   only "the files under `src/`" for the entry point. Each agent then grepped for
   `fonts.googleapis` and read `package.json` or `src/index.js`. *Fixed in this change:* the web
   setup now includes the font links and the exact `<script>` line.
4. **Agents also grep the token stylesheet for CSS variable names** to space out the page.
   `guideline.page-setup` tells them to check names against the stylesheet, so this is expected,
   and it cost two or three calls per task. No change.
5. **Batches of several `get --impl web` calls are too big for the agent's tool output.** Three of
   six CLI runs got a 2 KB preview of 33–35 KB and had to read the saved file back. *Filed: #356.*
6. **CLI agents first tried to chain commands in one shell line** (`T=…; $T setup; $T get …`).
   The eval allows only commands that start with the CLI path, so all seven of these were denied.
   The agents then switched to `batch`, which `help agents` recommends. This comes from the eval's
   permissions, not the CLI. In a normal session the person would be asked to approve. No change.
7. **MCP agents skipped `help` and went straight to `setup` and `search`,** making separate calls
   where the CLI used `batch`. The server's instructions worked as intended.

## Run it again

From the repository root, after `pnpm build`:

```bash
node evals/taproot-usage/setup-project.mjs
```

```bash
TAPROOT_EVAL_SUITE=build node evals/taproot-usage/run-eval.mjs --flow evals/taproot-usage/build-runs --variant baseline --concurrency 3
```

Use `--variant v1` for the CLI and `--variant v2` for MCP. The runner uses `claude-haiku-5-5`
unless `--model` names another model; this report's run used `--model claude-opus-5-5`, so compare
a Haiku run against its own baseline, not these numbers. A run that finds its results already
recorded skips them, so start a new flow folder for a new run. If the harness files changed, review
them and add `--approve-harness`. Then summarize:

```bash
node evals/taproot-usage/summarize-build.mjs
```

Results and full transcripts, including each page, are in `evals/taproot-usage/build-runs/`.
