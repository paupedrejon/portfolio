import type { Project } from "@/components/ProjectCard";


export const projects: Project[] = [
{
slug: "juego-multijugador",
title: "Shooter multijugador en Unreal Engine",
summary: "Prototipo con replicación personalizada y físicas.",
year: 2025,
tech: ["Unreal 5", "C++", "Netcode"],
repo: "https://github.com/tuusuario/proyecto-unreal",
demo: "https://youtu.be/XXXX",
image: "/proyectos/unreal.jpg",
},
{
slug: "analitica-servidor",
title: "Análisis de fallos en servidor web",
summary: "Modelado de fallos semanales y visualización.",
year: 2024,
tech: ["Python", "Pandas", "Plotly"],
repo: "https://github.com/tuusuario/fallos-servidor",
image: "/proyectos/analitica.jpg",
},
{
slug: "app-recetas",
title: "App de recetas con inventario por IA",
summary: "Prototipo que analiza fotos de la nevera y sugiere recetas.",
year: 2025,
tech: ["Raspberry Pi", "Next.js", "Vision"],
repo: "https://github.com/tuusuario/recetas-ia",
demo: "https://mi-demo.com",
},
];