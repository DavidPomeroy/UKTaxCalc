"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted flex items-center justify-center min-w-[12px] min-h-[12px] text-muted-foreground whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
