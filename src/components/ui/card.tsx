import * as React from "react";
import { cn } from "@/lib/utils";

const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={cn("rounded-xl border border-border bg-card shadow-sm transition-shadow", className)}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-1 px-6 pt-6 pb-3", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.ComponentProps<"h3">) => (
  <h3 className={cn("text-sm font-semibold leading-tight tracking-tight", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("px-6 pb-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
