/**
 * A record's `known-issues` entries each point at the issue that tracks the fix. The issue's state
 * lives on the tracker, so checking it needs the network and is opt-in: `ds-spec validate --issues`.
 *
 * @typedef {object} KnownIssue
 * @property {string} recordId
 * @property {string} file Path relative to the content folder.
 * @property {number} [line] 1-based, when known.
 * @property {string} path JSON pointer to the entry's `issue`.
 * @property {string} statement
 * @property {string} issue URL of the tracking issue.
 *
 * @typedef {KnownIssue & { state: "open" | "closed" | "unknown", reason?: string }} KnownIssueState
 */

const GITHUB_ISSUE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:issues|pull)\/(\d+)\/?$/;

/**
 * Every known-issue entry in the records, with where it is written.
 *
 * @param {import("./validate.js").CheckedRecord[]} records
 * @returns {KnownIssue[]}
 */
export function collectKnownIssues(records) {
  return records.flatMap(({ source, data }) =>
    (data["known-issues"] ?? []).map((entry, index) => {
      const path = `/known-issues/${index}/issue`;
      const line = source.locate(path);
      return { recordId: data.id, file: source.file, ...(line ? { line } : {}), path, ...entry };
    }),
  );
}

/**
 * Look up each entry's tracking issue. Only GitHub issue and pull request URLs can be checked;
 * anything else, or a failed lookup, comes back `unknown` with a reason.
 *
 * @param {KnownIssue[]} entries
 * @param {{ fetch?: typeof globalThis.fetch, token?: string }} [options] `token` defaults to
 *   `GITHUB_TOKEN` or `GH_TOKEN`. It is needed for a private repository, and raises GitHub's limit
 *   on unauthenticated requests.
 * @returns {Promise<KnownIssueState[]>}
 */
export async function issueStates(entries, options = {}) {
  const fetch = options.fetch ?? globalThis.fetch;
  const token = options.token ?? (process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  const lookups = new Map();
  return Promise.all(
    entries.map(async (entry) => {
      const match = entry.issue.match(GITHUB_ISSUE);
      if (!match) {
        return { ...entry, state: "unknown", reason: "only GitHub issue URLs can be checked" };
      }
      const [, owner, repo, number] = match;
      const api = `https://api.github.com/repos/${owner}/${repo}/issues/${number}`;
      if (!lookups.has(api)) lookups.set(api, lookup(api, fetch, token));
      return { ...entry, ...(await lookups.get(api)) };
    }),
  );
}

async function lookup(url, fetch, token) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const hint = token ? "" : " (a private repository needs GITHUB_TOKEN)";
      return { state: "unknown", reason: `GitHub answered ${response.status}${hint}` };
    }
    const { state } = await response.json();
    return state === "open" || state === "closed"
      ? { state }
      : { state: "unknown", reason: "GitHub returned no state" };
  } catch (error) {
    return { state: "unknown", reason: error.message };
  }
}
