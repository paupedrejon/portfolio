export default function Footer() {
return (
<footer className="border-t mt-16">
<div className="container py-10 text-sm opacity-80">
© {new Date().getFullYear()} Tu Nombre. Hecho con Next.js.
</div>
</footer>
);
}