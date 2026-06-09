import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-none border-2 border-primary bg-background px-4 py-3 text-base font-semibold ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[3px_3px_0px_0px_hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-150",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
