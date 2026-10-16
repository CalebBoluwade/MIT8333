import * as React from "react";
import { cn } from "@/lib/utils";

const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
  <div className="w-full overflow-x-auto">
    <table className={cn("w-full text-sm", className)} {...props} />
  </div>
);
const TableHeader = (p: React.ComponentProps<"thead">) => (
  <thead className="border-b border-border bg-muted/40" {...p} />
);
const TableBody = (p: React.ComponentProps<"tbody">) => <tbody {...p} />;
const TableRow = ({ className, ...p }: React.ComponentProps<"tr">) => (
  <tr className={cn("border-b border-border last:border-0 transition-colors hover:bg-muted/30", className)} {...p} />
);
const TableHead = ({ className, ...p }: React.ComponentProps<"th">) => (
  <th className={cn("h-10 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)} {...p} />
);
const TableCell = ({ className, ...p }: React.ComponentProps<"td">) => (
  <td className={cn("px-4 py-3 align-middle", className)} {...p} />
);

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
