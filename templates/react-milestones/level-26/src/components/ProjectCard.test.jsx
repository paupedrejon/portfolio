import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectCard from "./ProjectCard.jsx";

describe("ProjectCard", () => {
  it("muestra título y descripción", () => {
    render(
      <ProjectCard
        title="Demo"
        description="Descripción de prueba"
        image="/projects/portfolio.svg"
        imageAlt="Demo"
        tech={["React"]}
      />
    );
    expect(screen.getByText("Demo")).toBeTruthy();
    expect(screen.getByText("Descripción de prueba")).toBeTruthy();
  });
});
