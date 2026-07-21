import {
  action,
  agent,
  compute,
  decision,
  decisionEdge,
  defineWorkflow,
  shell,
} from "pi-workflows";

type ImplementInput = {
  task?: string;
};

const reviewChoices = ["clean", "issues_found"] as const;

/**
 * Generic implement→check→review loop with deterministic verification and
 * skill-compliance checks.
 *
 * Skill integration (soft):
 *   - ponytail: lazy implementation style
 *   - ponytail-review: over-engineering review lens
 *   - research-docs-grounding: evidence gathering when uncertain
 *   - AGENTS.md: project conventions
 *
 * Skill compliance (hard):
 *   - stylecheck action node reads changed files and checks for ponytail:
 *     comments. If the model skipped ponytail, this catches it.
 *   - typecheck and lint are shell nodes (deterministic, no model).
 *   - stylecheck is an action node (Node fs, cross-platform, no model).
 *
 * Reliability patterns:
 *   - validate:     structural checksum on agent output
 *   - shell:        deterministic checks (typecheck, lint, style markers)
 *   - switch:       failed checks route directly to fix
 *   - decision:     constrained-choice gate
 *   - loop:         fix→check→review cycles; maxSteps bounds
 *   - skill fallback: essential rules in prompts for when skills are absent
 *
 *   /workflow implement add frequency sort and top-N show-all to the tag panel
 */
export default defineWorkflow({
  name: "implement",
  title: ({ input }) => {
    const task = (input as ImplementInput).task;
    return task ? `implement: ${task.slice(0, 80)}` : undefined;
  },
  presentationPrompt:
    "Summarize what was implemented, what checks passed, and any remaining limitations. Be concise.",
  maxSteps: 20,
  startAt: "implement",

  nodes: {
    // ── Agent: implement the task ──────────────────────────────────────────
    implement: agent({
      timeoutMs: 60 * 60_000,
      statusDetail: "implementing",
      prompt: ({ input }) => {
        const task =
          (input as ImplementInput).task ??
          "the plan discussed so far in this conversation";
        return [
          `Implement ${task} end-to-end.`,
          "",
          "## Style",
          "Use the ponytail skill if loaded (laziest solution that works, stdlib first,",
          "shortest diff, ponytail: comments for deferred work).",
          "If the ponytail skill is not loaded, apply these rules:",
          "  - Question whether each piece needs to exist at all (YAGNI).",
          "  - Reuse what is already in this codebase before writing new code.",
          "  - Prefer stdlib and native platform features over new dependencies.",
          "  - Mark deliberate simplifications with a ponytail: comment naming the",
          "    ceiling and upgrade path (e.g. // ponytail: global sort, per-key if needed).",
          "  - Fewest files, shortest working diff, no speculative abstractions.",
          "",
          "## Uncertainty",
          "If you are uncertain about an API, config, or pattern, use the",
          "research-docs-grounding skill if loaded. If it is not loaded, read the",
          "relevant source files in this repo before guessing.",
          "",
          "## Project conventions",
          "Follow AGENTS.md conventions: pnpm commands, verification with",
          "`pnpm verify`, branch workflow, one PR per issue.",
        ].join("\n");
      },
      expectedOutput: `{ "summary": "what was implemented", "files": ["changed file path"] }`,
      validate: (output) => {
        if (!output.summary || typeof output.summary !== "string") {
          throw new Error(
            "summary must be a non-empty string describing what changed",
          );
        }
        if (!Array.isArray(output.files) || output.files.length === 0) {
          throw new Error(
            "files must be a non-empty array of paths that were changed",
          );
        }
        return output;
      },
    }),

    // ── Shell: deterministic typecheck ─────────────────────────────────────
    typecheck: shell({
      statusDetail: "type-checking",
      exec: () => ({
        command: "pnpm",
        args: ["--filter", "web", "exec", "tsc", "--noEmit"],
        timeoutMs: 60_000,
        allowNonZeroExit: true,
        shell: true, // Windows: pnpm is a .cmd batch script
      }),
      parse: (result) => ({
        status: result.exitCode === 0 ? "pass" : "fail",
        output: (result.stdout + "\n" + result.stderr).slice(-2000),
      }),
    }),

    // ── Shell: deterministic lint ─────────────────────────────────────────
    lint: shell({
      statusDetail: "linting",
      exec: () => ({
        command: "pnpm",
        args: ["--filter", "web", "lint"],
        timeoutMs: 60_000,
        allowNonZeroExit: true,
        shell: true, // Windows: pnpm is a .cmd batch script
      }),
      parse: (result) => ({
        status: result.exitCode === 0 ? "pass" : "fail",
        output: (result.stdout + "\n" + result.stderr).slice(-2000),
      }),
    }),

    // ── Action: deterministic style/skill compliance check ───────────────
    // Uses Node fs (not grep) so it works on all platforms.
    // The model said it would mark simplifications — this checks that it did.
    stylecheck: action({
      statusDetail: "checking style markers",
      run: async ({ outputs }) => {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const files: string[] = (outputs.implement as any)?.files ?? [];
        const markers: string[] = [];

        for (const file of files) {
          try {
            const resolved = path.resolve(file);
            const content = await fs.readFile(resolved, "utf8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i]!.includes("ponytail:")) {
                markers.push(`${file}:${i + 1}: ${lines[i]!.trim()}`);
              }
            }
          } catch {
            // File might not exist yet or be unreadable — skip it
          }
        }

        const hasMarkers = markers.length > 0;
        return {
          status: hasMarkers ? "pass" : "warn",
          markers: markers.length,
          detail: hasMarkers
            ? `Found ${markers.length} ponytail: marker(s):\n${markers.join("\n")}`
            : "No ponytail: markers found. If any simplifications were made, they must be marked with a ponytail: comment.",
        };
      },
    }),

    // ── Decision: semantic + over-engineering review ───────────────────────
    review: decision({
      choices: reviewChoices,
      question: ({ outputs }) =>
        [
          "Critically review your implementation.",
          "",
          "Correctness: Look for bugs, missed requirements, and failing checks.",
          "Over-engineering: Use the ponytail-review skill if loaded.",
          "  If not loaded, check for: dead code, unneeded abstractions,",
          "  speculative flexibility, hand-rolled stdlib, and redundant deps.",
          "",
          `Style check: ${JSON.stringify(outputs.stylecheck)}`,
          "If the style check shows 'warn' and you made simplifications,",
          "pick `issues_found` so you can add the missing ponytail: comments.",
          "",
          "Pick `issues_found` if anything must be fixed (correctness,",
          "over-engineering, or missing style markers). Pick `clean` only",
          "if correctness, simplicity, and style are all satisfactory.",
          "",
          `Typecheck: ${JSON.stringify(outputs.typecheck)}`,
          `Lint: ${JSON.stringify(outputs.lint)}`,
          `Implementation: ${JSON.stringify(outputs.implement)}`,
        ].join("\n"),
    }),

    // ── Agent: fix issues ─────────────────────────────────────────────────
    fix: agent({
      timeoutMs: 30 * 60_000,
      statusDetail: "fixing",
      prompt: ({ outputs }) => {
        const lines = [
          "Fix the issues. Focus on what failed.",
          "Apply ponytail principles if the skill is loaded (shortest fix that works).",
          "If ponytail is not loaded: minimum diff, no speculative changes,",
          "ponytail: comment for deferred simplifications.",
          "",
        ];
        const tc = outputs.typecheck as { status: string; output: string };
        if (tc?.status === "fail") {
          lines.push(`Typecheck errors:\n${tc.output}`);
        }
        const ln = outputs.lint as { status: string; output: string };
        if (ln?.status === "fail") {
          lines.push(`Lint errors:\n${ln.output}`);
        }
        const sc = outputs.stylecheck as { status: string; detail: string };
        if (sc?.status === "warn") {
          lines.push(`Style check: ${sc.detail}`);
          lines.push("Add ponytail: comments to any simplifications you made.");
        }
        if (outputs.review) {
          lines.push(`Review: ${JSON.stringify(outputs.review)}`);
        }
        return lines.join("\n");
      },
      expectedOutput: `{ "fixed": "what was changed" }`,
    }),

    // ── Compute: collect results ───────────────────────────────────────────
    finalize: compute({
      run: ({ outputs }) => ({
        implementation: outputs.implement,
        typecheck: outputs.typecheck,
        lint: outputs.lint,
        stylecheck: outputs.stylecheck,
        review: outputs.review,
      }),
    }),
  },

  edges: [
    { from: "implement", to: "typecheck" },
    // Failed deterministic checks route directly to fix — no point asking
    // the model to review code that doesn't compile or doesn't lint.
    {
      from: "typecheck",
      switch: { on: "$.status", cases: { pass: "lint", fail: "fix" } },
    },
    {
      from: "lint",
      switch: { on: "$.status", cases: { pass: "stylecheck", fail: "fix" } },
    },
    // Style check uses "warn" not "fail" — missing ponytail: comments are
    // a style issue, not a build error. Route to review so the model can
    // decide whether simplifications were actually made. The review prompt
    // shows the style check result and asks the model to judge.
    {
      from: "stylecheck",
      switch: {
        on: "$.status",
        cases: { pass: "review", warn: "review", fail: "fix" },
      },
    },
    decisionEdge({
      from: "review",
      choices: reviewChoices,
      cases: {
        clean: "finalize",
        issues_found: "fix",
      },
    }),
    { from: "fix", to: "typecheck" },
  ],
});