import { describe, expect, it } from "vitest";
import { applySequentialCheckpoints } from "@/lib/cursos/verify";
import type { Level } from "@/lib/cursos/levels";

const mockLevel: Level = {
  id: 1,
  slug: "test",
  title: "Test",
  block: "Test",
  description: "",
  objective: "",
  preview: { title: "", description: "" },
  estimatedMinutes: 10,
  checkpoints: [
    { id: "a", label: "A", assert: "" },
    { id: "b", label: "B", assert: "" },
    { id: "c", label: "C", assert: "" },
    { id: "d", label: "D", assert: "" },
  ],
};

describe("applySequentialCheckpoints", () => {
  it("solo marca el primer paso aunque varios checks raw pasen", () => {
    const completed = applySequentialCheckpoints(mockLevel, [
      { checkpointId: "a", passed: true },
      { checkpointId: "b", passed: true },
      { checkpointId: "c", passed: true },
      { checkpointId: "d", passed: false },
    ]);
    expect(completed).toEqual({ a: true, b: false, c: false, d: false });
  });

  it("avanza al siguiente paso si el anterior ya estaba completado", () => {
    const completed = applySequentialCheckpoints(
      mockLevel,
      [
        { checkpointId: "a", passed: true },
        { checkpointId: "b", passed: true },
        { checkpointId: "c", passed: true },
        { checkpointId: "d", passed: false },
      ],
      { a: true }
    );
    expect(completed).toEqual({ a: true, b: true, c: false, d: false });
  });

  it("conserva pasos previos completados aunque el raw falle", () => {
    const completed = applySequentialCheckpoints(
      mockLevel,
      [
        { checkpointId: "a", passed: false },
        { checkpointId: "b", passed: false },
        { checkpointId: "c", passed: false },
        { checkpointId: "d", passed: false },
      ],
      { a: true, b: true }
    );
    expect(completed).toEqual({ a: true, b: true, c: false, d: false });
  });
});
