import type { VariantProps } from "class-variance-authority";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-2 aria-invalid:ring-2 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#007acc] text-white hover:bg-[#0062a3] shadow-xs active:bg-[#005a96]",
        outline:
          "border-border bg-background hover:bg-secondary hover:text-foreground dark:hover:bg-secondary/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary hover:text-foreground dark:hover:bg-secondary/40",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        link: "text-[#007acc] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-[44px] gap-2 px-4 text-sm font-medium",
        xs: "h-7 gap-1 rounded-md px-2 text-xs",
        sm: "h-9 gap-1.5 rounded-md px-3 text-xs",
        lg: "h-12 min-h-[48px] gap-2 px-6 text-base font-medium",
        icon: "size-10 rounded-lg",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
