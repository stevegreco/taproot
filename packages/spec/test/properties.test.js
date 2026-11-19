/**
 * Property tests: each states something that must hold for any input, and fast-check generates
 * inputs to break it. They complement the example tests, which check the cases someone thought of.
 */
import fc from "fast-check";
import { beforeAll, describe, expect, it } from "vitest";
import { loadSpec } from "../src/index.js";
import { editDistance, splitWords } from "../src/util.js";

/** @type {import("../src/index.js").Spec} */
let shipped;

beforeAll(async () => {
  shipped = await loadSpec();
});

/** Quote a word the way a POSIX shell reads it: in single quotes, with each `'` as `'\''`. */
const shellQuote = (word) => `'${word.replaceAll("'", "'\\''")}'`;

describe("splitWords", () => {
  it("reads back any list of words a shell would quote", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), fc.constantFrom(" ", "  ", "\t"), (words, gap) => {
        expect(splitWords(words.map(shellQuote).join(gap))).toEqual(words);
      }),
    );
  });

  it("splits unquoted words on whitespace", () => {
    const plain = fc.stringMatching(/^[a-z0-9.#:+-]+$/);
    fc.assert(
      fc.property(fc.array(plain, { minLength: 1 }), (words) => {
        expect(splitWords(words.join(" "))).toEqual(words);
      }),
    );
  });
});

describe("editDistance", () => {
  it("is zero only for equal strings", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        expect(editDistance(a, b) === 0).toBe(a === b);
      }),
    );
  });

  it("is symmetric", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        expect(editDistance(a, b)).toBe(editDistance(b, a));
      }),
    );
  });

  it("is at least the difference in length and at most the longer length", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const d = editDistance(a, b);
        expect(d).toBeGreaterThanOrEqual(Math.abs(a.length - b.length));
        expect(d).toBeLessThanOrEqual(Math.max(a.length, b.length));
      }),
    );
  });

  it("counts one swap of neighbouring characters as one edit", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 2 }), fc.nat(), (word, n) => {
        const i = n % (word.length - 1);
        fc.pre(word[i] !== word[i + 1]);
        const swapped = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
        expect(editDistance(word, swapped)).toBe(1);
      }),
    );
  });
});

describe("the shipped spec", () => {
  it("gets every listed record by its id", () => {
    const ids = shipped.list().map((record) => record.id);
    fc.assert(
      fc.property(fc.constantFrom(...ids), (id) => {
        expect(shipped.get(id)?.id).toBe(id);
      }),
    );
  });

  it("resolves every rule address to that rule", () => {
    const all = shipped.rules();
    fc.assert(
      fc.property(fc.constantFrom(...all), (rule) => {
        const found = shipped.section(rule.address);
        expect(found).toBeDefined();
        expect(found.content.statement).toBe(rule.statement);
        expect(found.content.level).toBe(rule.level);
        expect(found.content.topic).toBe(rule.topic);
      }),
    );
  });

  it("answers any search with records it can get, best first, within the limit", () => {
    const words = shipped.list().flatMap((record) => record.title.toLowerCase().split(/\s+/));
    const query = fc.oneof(
      fc.string(),
      fc.array(fc.constantFrom(...words), { minLength: 1, maxLength: 4 }).map((w) => w.join(" ")),
    );
    fc.assert(
      fc.property(query, fc.integer({ min: 1, max: 20 }), (text, limit) => {
        const hits = shipped.search(text, { limit });
        expect(hits.length).toBeLessThanOrEqual(limit);
        for (const hit of hits) expect(shipped.get(hit.id)).toBeDefined();
        for (let i = 1; i < hits.length; i++) {
          expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
        }
      }),
    );
  });

  it("finds a record by its exact title", () => {
    const records = shipped.list();
    fc.assert(
      fc.property(fc.constantFrom(...records), (record) => {
        const hits = shipped.search(record.title);
        expect(hits.map((hit) => hit.id)).toContain(record.id);
      }),
    );
  });
});
