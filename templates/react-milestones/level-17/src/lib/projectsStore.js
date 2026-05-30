const STORAGE_KEY = "portfolio-projects-extra";

export function getExtraProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addProject(project) {
  const list = getExtraProjects();
  list.push({
    id: Date.now(),
    title: project.title,
    description: project.description,
    image: project.image ?? "/projects/landing.svg",
    imageAlt: project.imageAlt ?? project.title,
    tech: project.tech ?? ["Demo"],
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}
