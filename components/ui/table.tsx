"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TableProps = React.HTMLAttributes<HTMLTableElement>;

function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}
Table.displayName = "Table";

export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn(
        "mt-4 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
TableCaption.displayName = "TableCaption";

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}
TableHeader.displayName = "TableHeader";

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}
TableBody.displayName = "TableBody";

export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn("[&_tr]:border-b [&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}
TableFooter.displayName = "TableFooter";

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-accent/50 data-[state=selected]:bg-accent",
        className
      )}
      {...props}
    />
  );
}
TableRow.displayName = "TableRow";

export type TableHeadProps = React.HTMLAttributes<HTMLTableCellElement>;

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-12 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}
TableHead.displayName = "TableHead";

export type TableCellProps = React.HTMLAttributes<HTMLTableDataCellElement>;

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}
TableCell.displayName = "TableCell";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
