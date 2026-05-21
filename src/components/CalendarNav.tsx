"use client";

import { useRouter } from "next/navigation";
import { Calendar, type CalendarDay } from "./Calendar";

export function CalendarNav({
  days,
  selectedDate,
}: {
  days: CalendarDay[];
  selectedDate: string;
}) {
  const router = useRouter();
  return (
    <Calendar
      days={days}
      selectedDate={selectedDate}
      onSelect={(d) => router.push(`/overview?date=${d}`)}
    />
  );
}
