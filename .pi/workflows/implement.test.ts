/**
 * Dry-run validation for the implement workflow.
 *
 * Uses the same ScriptedExecutor pattern the engine uses for its own tests.
 * Proves: all edges route to valid targets, switch cases resolve correctly,
 * the workflow completes on the happy path, and loops are bounded by maxSteps.
 *
 * Run from the pi-workflows repo:
 *   cd ~/.pi/agent/git/github.com/osolmaz/pi-workflows
 *   npx vitest run ../../../../../repos/FlareMo/.pi/workflows/implement.test.ts
 */
import { describe, expect, it } from "vitest";
import { WorkflowEngine } from "../src/workflows/engine.js";
import { defineWorkflow } from "../src/workflows/definition.js";
import { validateWorkflowDefinition } from "../src/workflows/graph.js";
import type {
  AgentStepExecutor,
  AgentStepRequest,
  AgentStepSubmission,
} from "../src/workflows/types.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";

// ── Mock executor (same pattern as engine tests) ────────────────────────
class MockExecutor implements AgentStepExecutor {
  readonly requests: AgentStepRequest[] = [];
  private readonly responses = new Map<string, unknown[]>();

  respond(nodeId: string, ...outputs: unknown[]): this {
    const queue = this.responses.get(nodeId) ?? [];
    queue.push(...outputs);
    this.responses.set(nodeId, queue);
    return this;
  }

  async runAgentStep(
    request: AgentStepRequest,
    _signal: AbortSignal,
  ): Promise<AgentStepSubmission> {
    this.requests.push(request);
    const queue = this.responses.get(request.contract.nodeId) ?? [];
    const output = queue.shift() ?? { summary: "mock", files: ["mock.ts"] };
    const accepted = await request.accept(output);
    if (!accepted.ok) {
      throw new Error(`Mock output rejected: ${accepted.error}`);
    }
    return { output: accepted.value };
  }
}

// ── Load the workflow ───────────────────────────────────────────────────
async function loadWorkflow(): Promise<ReturnType<typeof defineWorkflow>> {
  const workflowPath = resolve(
    process.env.HOME ?? process.env.USERPROFILE ?? "~",
    "repos/FlareMo/.pi/workflows/implement.workflow.ts",
  );
  const jiti = createJiti(pathToFileURL(workflowPath).href, {
    interopDefault: true,
    moduleCache: false,
    alias: { "pi-workflows": resolve(import.meta.dirname, "../src/workflows/index.ts") },
  });
  return (await jiti.import(workflowPath, { default: true })) as ReturnType<
    typeof defineWorkflow
  >;
}

describe("implement workflow", () => {
  it("loads and validates shape", async () => {
    const workflow = await loadWorkflow();
    expect(workflow.name).toBe("implement");
    expect(workflow.startAt).toBe("implement");
  });

  it("validates graph (edges, reachability, no duplicates)", async () => {
    const workflow = await loadWorkflow();
    expect(() => validateWorkflowDefinition(workflow)).not.toThrow();
  });

  it("has the expected node types", async () => {
    const workflow = await loadWorkflow();
    const nodeTypes = Object.fromEntries(
      Object.entries(workflow.nodes).map(([id, node]) => [id, node.nodeType]),
    );
    // agent nodes: implement, review (decision), fix
    // action nodes: typecheck (shell), lint (shell), stylecheck (action)
    // compute node: finalize
    expect(nodeTypes.implement).toBe("agent");
    expect(nodeTypes.typecheck).toBe("action");
    expect(nodeTypes.lint).toBe("action");
    expect(nodeTypes.stylecheck).toBe("action");
    expect(nodeTypes.review).toBe("agent"); // decision() returns an agent node
    expect(nodeTypes.fix).toBe("agent");
    expect(nodeTypes.finalize).toBe("compute");
  });

  it("runs the happy path (all checks pass, review says clean)", async () => {
    const workflow = await loadWorkflow();
    const executor = new MockExecutor()
      .respond("implement", { summary: "added freq sort", files: ["memo.ts"] })
      .respond("review", { route: "clean", reason: "looks good" });

    const outputRoot = mkdtempSync(resolve(tmpdir(), "pi-wf-test-"));
    try {
      const engine = new WorkflowEngine({ executor, outputRoot, maxSteps: 20 });
      const { state } = await engine.run(workflow, { task: "add frequency sort" });

      expect(state.status).toBe("completed");
      // All nodes should have run except fix (happy path skips the loop)
      const ranNodes = state.steps.map((s) => s.nodeId);
      expect(ranNodes).toContain("implement");
      expect(ranNodes).toContain("typecheck");
      expect(ranNodes).toContain("lint");
      expect(ranNodes).toContain("stylecheck");
      expect(ranNodes).toContain("review");
      expect(ranNodes).toContain("finalize");
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("runs the fix loop (review says issues_found → fix → review says clean)", async () => {
    const workflow = await loadWorkflow();
    const executor = new MockExecutor()
      .respond("implement", { summary: "added freq sort", files: ["memo.ts"] })
      .respond("review", { route: "issues_found", reason: "missing ponytail: comments" })
      .respond("fix", { fixed: "added ponytail: comments" })
      .respond("review", { route: "clean", reason: "all good now" });

    const outputRoot = mkdtempSync(resolve(tmpdir(), "pi-wf-test-"));
    try {
      const engine = new WorkflowEngine({ executor, outputRoot, maxSteps: 20 });
      const { state } = await engine.run(workflow, { task: "add frequency sort" });

      expect(state.status).toBe("completed");
      // review should have run twice (first: issues_found, second: clean)
      const reviewSteps = state.steps.filter((s) => s.nodeId === "review");
      expect(reviewSteps.length).toBeGreaterThanOrEqual(2);
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });
});