import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-[transform,background,opacity,color,box-shadow] duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:enabled:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-forest text-white hover:enabled:bg-forest-hover",
        primary:
          "bg-forest text-white hover:enabled:bg-forest-hover",
        outline:
          "border-[1.5px] border-ink bg-transparent text-ink",
        secondary:
          "border-[1.5px] border-line bg-card text-ink hover:enabled:bg-sage",
        ghost:
          "border-[1.5px] border-line bg-card text-ink hover:enabled:bg-sage",
        destructive:
          "bg-danger text-white hover:enabled:bg-danger/90",
        danger:
          "bg-danger text-white hover:enabled:bg-danger/90",
        link: "border-transparent bg-transparent text-ink underline underline-offset-[3px] hover:bg-transparent",
      },
      size: {
        default:
          "min-h-[52px] w-full rounded-pill px-[22px] py-3.5",
        md: "min-h-[52px] w-full rounded-pill px-[22px] py-3.5",
        xs: "h-6 gap-1 rounded-pill px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-9 w-auto gap-1.5 rounded-pill px-3.5 py-2 text-xs [&_svg:not([class*='size-'])]:size-[15px]",
        lg: "min-h-[52px] w-full rounded-pill px-[22px] py-3.5",
        icon: "size-11 rounded-full border-[1.5px] border-line bg-card text-ink hover:bg-sage active:scale-[0.94] [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-10 rounded-full border-[1.5px] border-line bg-card text-ink hover:bg-sage [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

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
  )
}

export { Button, buttonVariants }
