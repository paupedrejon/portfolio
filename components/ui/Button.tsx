import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium border transition-colors",
  {
    variants: {
      variant: {
        solid:
          "bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90",
        ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
      },
    },
    defaultVariants: { variant: "solid" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  href?: string; // si lo pasas, renderizamos <Link>
}

export function Button({ className, variant, href, ...props }: ButtonProps) {
  const classes = cn(button({ variant, className }));
  if (href) {
    return (
      <Link href={href} className={classes} {...(props as any)}>
        {props.children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {props.children}
    </button>
  );
}

// 👇 añade esto para permitir importar como default O con nombre
export default Button;
