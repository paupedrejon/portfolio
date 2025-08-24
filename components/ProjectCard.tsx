import Link from "next/link";


export interface Project {
slug: string;
title: string;
summary: string;
year?: number;
tech: string[];
repo?: string;
demo?: string;
image?: string;
}


export default function ProjectCard({ project }: { project: Project }) {
const { title, summary, tech, repo, demo, image } = project;
return (
<article className="group border border-white/10 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white/[0.02]">
{image && (
<img src={image} alt="" className="w-full aspect-video object-cover" />
)}
<div className="p-4">
<h3 className="font-semibold text-lg">{title}</h3>
<p className="mt-1 opacity-80 text-sm">{summary}</p>
<ul className="flex flex-wrap gap-2 mt-3">
{tech.map((t) => (
<li key={t} className="text-xs px-2 py-1 rounded-full border opacity-80">
{t}
</li>
))}
</ul>
<div className="mt-4 flex gap-3">
{repo && (
<a className="underline" href={repo} target="_blank" rel="noreferrer">
Código
</a>
)}
{demo && (
<a className="underline" href={demo} target="_blank" rel="noreferrer">
Demo
</a>
)}
</div>
</div>
</article>
);
}