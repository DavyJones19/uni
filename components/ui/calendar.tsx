import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-8",
        month: "space-y-4",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold text-zinc-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "h-7 w-7 border-zinc-200 bg-white p-0 opacity-70 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "w-9 rounded-md text-center text-[0.8rem] font-medium text-zinc-500",
        row: "mt-2 flex w-full",
        cell: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-9 w-9 rounded-md p-0 font-normal text-zinc-900 aria-selected:opacity-100",
        ),
        day_today: "bg-zinc-100 text-zinc-900",
        day_selected: "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white",
        day_outside: "text-zinc-400 opacity-50",
        day_disabled: "text-zinc-300 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}