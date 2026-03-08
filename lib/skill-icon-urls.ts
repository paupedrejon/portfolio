/**
 * All skill icons: Simple Icons CDN, white monochrome (ffffff).
 * Unified dark-portfolio aesthetic.
 * https://cdn.simpleicons.org/{slug}/ffffff
 */

const SIMPLEICONS_BASE = "https://cdn.simpleicons.org";
const ICON_COLOR = "ffffff";

const SKILL_TO_SLUG: Record<string, string> = {
  "C / C++": "cplusplus",
  Java: "openjdk",
  Python: "python",
  SQL: "mysql",
  R: "r",
  "HTML / CSS": "html5",
  "React / Next.js": "nextdotjs",
  TailwindCSS: "tailwindcss",
  "Node.js": "nodedotjs",
  PostgreSQL: "postgresql",
  MongoDB: "mongodb",
  LLM: "openai",
  RAG: "huggingface",
  NLP: "huggingface",
  "Neural Networks": "tensorflow",
  ExP: "openai",
  "Autonomous Agents": "langchain",
  "Unreal Engine": "unrealengine",
  Unity: "unity",
  Blender: "blender",
  Photoshop: "adobephotoshop",
  Substance: "adobe",
  "After Effects": "adobeaftereffects",
  Git: "git",
  Jira: "jira",
  Trello: "trello",
  "3D Printing": "printables",
  Proteus: "proteus",
  "Computer Systems": "linux",
};

export function getSkillIconUrl(skillTitle: string): string {
  const slug = SKILL_TO_SLUG[skillTitle] || "code";
  return `${SIMPLEICONS_BASE}/${slug}/${ICON_COLOR}`;
}
