'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn'; // si no tienes esta utilidad, elimina el import y concatena strings

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export default function Button({
  href,
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    'inline-block rounded-full px-6 py-3 font-semibold tracking-wide transition-colors';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-indigo-600/80 hover:bg-indigo-600 text-white',
    secondary: 'bg-pink-600/80 hover:bg-pink-600 text-white',
    ghost: 'bg-white/10 hover:bg-white/20 text-white',
  };

  // Si no usas cn(), puedes usar: `${base} ${variants[variant]} ${className ?? ''}`
  return (
    <Link
      href={href}
      className={cn ? cn(base, variants[variant], className) : `${base} ${variants[variant]} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
