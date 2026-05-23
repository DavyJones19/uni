import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "",
        months: "flex flex-col gap-4 sm:flex-row sm:gap-8",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold text-zinc-900",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "h-7 w-7 border-zinc-200 bg-white p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "h-7 w-7 border-zinc-200 bg-white p-0 opacity-70 hover:opacity-100",
        ),
        chevron: "h-4 w-4",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-center text-[0.8rem] font-medium text-zinc-500",
        week: "mt-2 flex w-full",
        day: cn(
          "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-9 w-9 rounded-md p-0 font-normal text-zinc-900 aria-selected:opacity-100",
        ),
        today: "bg-zinc-100 text-zinc-900",
        selected: "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white",
        outside: "text-zinc-400 opacity-50",
        disabled: "text-zinc-300 opacity-50",
        hidden: "invisible",
        range_start: "",
        range_middle: "",
        range_end: "",
        focused: "",
        ...classNames,
      }}
      components={{
        Chevron: ({
          orientation,
          className: chevronClassName,
          ...chevronProps
        }) =>
          orientation === "right" ? (
            <ChevronRight
              className={cn("h-4 w-4", chevronClassName)}
              {...chevronProps}
            />
          ) : (
            <ChevronLeft
              className={cn("h-4 w-4", chevronClassName)}
              {...chevronProps}
            />
          ),
      }}
      {...props}
    />
  );
}
