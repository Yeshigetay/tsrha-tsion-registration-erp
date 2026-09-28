
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AcademicYear = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

type EthiopianDate = {
  year: number;
  month: number;
  day: number;
};

type AcademicSemester = {
  id: string;
  academic_year_id: string;
  semester_number: number;
  name: string;

  start_year: number | null;
  start_month: number | null;
  start_day: number | null;

  end_year: number | null;
  end_month: number | null;
  end_day: number | null;
};

type CalendarEventType =
  | "holiday"
  | "vacation"
  | "closed"
  | "event"
  | "other";

type CalendarEvent = {
  id: string;
  academic_year_id: string;
  title: string;
  event_type: CalendarEventType;

  start_year: number;
  start_month: number;
  start_day: number;

  end_year: number;
  end_month: number;
  end_day: number;

  description: string | null;
};

type AcademicGrade = {
  id: string;
  academic_year_id: string;
  grade_number: number;
  name: string;
};

const ETHIOPIAN_MONTHS = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
];

const ETHIOPIAN_NUMBERS: Record<number, string> = {
  1: "፩",
  2: "፪",
  3: "፫",
  4: "፬",
  5: "፭",
  6: "፮",
  7: "፯",
  8: "፰",
  9: "፱",
  10: "፲",
  11: "፲፩",
  12: "፲፪",
};

function toEthiopianNumber(number: number) {
  return (
    ETHIOPIAN_NUMBERS[number] ??
    String(number)
  );
}

function isEthiopianLeapYear(year: number) {
  return (year + 1) % 4 === 0;
}

function getEthiopianMonthDays(
  year: number,
  month: number,
) {
  if (month <= 12) {
    return 30;
  }

  return isEthiopianLeapYear(year)
    ? 6
    : 5;
}

function createEmptyDate(
  year: number,
): EthiopianDate {
  return {
    year,
    month: 1,
    day: 1,
  };
}

function isValidEthiopianDate(
  date: EthiopianDate,
) {
  if (date.year < 1) {
    return false;
  }

  if (
    date.month < 1 ||
    date.month > 13
  ) {
    return false;
  }

  const maxDay =
    getEthiopianMonthDays(
      date.year,
      date.month,
    );

  return (
    date.day >= 1 &&
    date.day <= maxDay
  );
}

function ethiopianDateKey(
  date: EthiopianDate,
) {
  return (
    date.year * 10000 +
    date.month * 100 +
    date.day
  );
}

function formatEthiopianDateParts(
  date: EthiopianDate | null,
) {
  if (!date) {
    return "—";
  }

  return `${date.year} ${ETHIOPIAN_MONTHS[date.month - 1]} ${date.day} ዓ.ም.`;
}

function getSemesterStartDate(
  semester: AcademicSemester,
) {
  if (
    !semester.start_year ||
    !semester.start_month ||
    !semester.start_day
  ) {
    return null;
  }

  return {
    year: semester.start_year,
    month: semester.start_month,
    day: semester.start_day,
  };
}

function getSemesterEndDate(
  semester: AcademicSemester,
) {
  if (
    !semester.end_year ||
    !semester.end_month ||
    !semester.end_day
  ) {
    return null;
  }

  return {
    year: semester.end_year,
    month: semester.end_month,
    day: semester.end_day,
  };
}

function getEventStartDate(
  event: CalendarEvent,
): EthiopianDate {
  return {
    year: event.start_year,
    month: event.start_month,
    day: event.start_day,
  };
}

function getEventEndDate(
  event: CalendarEvent,
): EthiopianDate {
  return {
    year: event.end_year,
    month: event.end_month,
    day: event.end_day,
  };
}

function getEventTypeLabel(
  type: CalendarEventType,
) {
  switch (type) {
    case "holiday":
      return "በዓል";

    case "vacation":
      return "ዕረፍት";

    case "closed":
      return "ዝግ ጊዜ";

    case "event":
      return "መርሃ ግብር";

    default:
      return "ሌላ";
  }
}

function getEventTypeStyle(
  type: CalendarEventType,
) {
  switch (type) {
    case "holiday":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "vacation":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "closed":
      return "bg-red-50 text-red-700 border-red-200";

    case "event":
      return "bg-green-50 text-green-700 border-green-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function EthiopianDatePicker({
  label,
  value,
  academicYear,
  onChange,
}: {
  label: string;
  value: EthiopianDate | null;
  academicYear: string;
  onChange: (
    value: EthiopianDate,
  ) => void;
}) {
  const parsedYear =
    Number(academicYear.match(/\d+/)?.[0]) ||
    new Date().getFullYear() -
      7;

  const currentYear =
    value?.year || parsedYear;

  const currentMonth =
    value?.month || 1;

  const currentDay =
    value?.day || 1;

  const days = Array.from(
    {
      length: getEthiopianMonthDays(
        currentYear,
        currentMonth,
      ),
    },
    (_, index) => index + 1,
  );

  const years = Array.from(
    { length: 5 },
    (_, index) =>
      parsedYear - 2 + index,
  );

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#172033]">
        {label}
      </label>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={currentYear}
          onChange={(event) => {
            const nextYear = Number(
              event.target.value,
            );

            const maxDay =
              getEthiopianMonthDays(
                nextYear,
                currentMonth,
              );

            onChange({
              year: nextYear,
              month: currentMonth,
              day: Math.min(
                currentDay,
                maxDay,
              ),
            });
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold outline-none transition focus:border-[#0d3b78] focus:ring-2 focus:ring-[#0d3b78]/10"
        >
          {years.map((year) => (
            <option
              key={year}
              value={year}
            >
              {year} ዓ.ም.
            </option>
          ))}
        </select>

        <select
          value={currentMonth}
          onChange={(event) => {
            const nextMonth = Number(
              event.target.value,
            );

            const maxDay =
              getEthiopianMonthDays(
                currentYear,
                nextMonth,
              );

            onChange({
              year: currentYear,
              month: nextMonth,
              day: Math.min(
                currentDay,
                maxDay,
              ),
            });
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold outline-none transition focus:border-[#0d3b78] focus:ring-2 focus:ring-[#0d3b78]/10"
        >
          {ETHIOPIAN_MONTHS.map(
            (month, index) => (
              <option
                key={month}
                value={index + 1}
              >
                {month}
              </option>
            ),
          )}
        </select>

        <select
          value={currentDay}
          onChange={(event) =>
            onChange({
              year: currentYear,
              month: currentMonth,
              day: Number(
                event.target.value,
              ),
            })
          }
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold outline-none transition focus:border-[#0d3b78] focus:ring-2 focus:ring-[#0d3b78]/10"
        >
          {days.map((day) => (
            <option
              key={day}
              value={day}
            >
              {day}
            </option>
          ))}
        </select>
      </div>

      {value && (
        <p className="mt-2 text-xs font-semibold text-gray-500">
          {formatEthiopianDateParts(value)}
        </p>
      )}
    </div>
  );
}

function SemesterCard({
  semester,
  yearId,
  yearName,
  onSaved,
}: {
  semester: AcademicSemester;
  yearId: string;
  yearName: string;
  onSaved: () => void;
}) {
  const supabase = createClient();

  const [editing, setEditing] =
    useState(false);

  const [startDate, setStartDate] =
    useState<EthiopianDate | null>(
      getSemesterStartDate(semester),
    );

  const [endDate, setEndDate] =
    useState<EthiopianDate | null>(
      getSemesterEndDate(semester),
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setStartDate(
      getSemesterStartDate(semester),
    );

    setEndDate(
      getSemesterEndDate(semester),
    );
  }, [semester]);

  const isConfigured =
    Boolean(startDate && endDate);

  async function saveSemester() {
    setError("");

    if (!startDate || !endDate) {
      setError(
        "የሴሚስተሩን መጀመሪያና መጨረሻ ቀን ይምረጡ።",
      );
      return;
    }

    if (
      !isValidEthiopianDate(
        startDate,
      ) ||
      !isValidEthiopianDate(endDate)
    ) {
      setError(
        "የተመረጠው ቀን ትክክል አይደለም።",
      );
      return;
    }

    if (
      ethiopianDateKey(endDate) <
      ethiopianDateKey(startDate)
    ) {
      setError(
        "የመጨረሻ ቀን ከመጀመሪያ ቀን በፊት መሆን አይችልም።",
      );
      return;
    }

    setSaving(true);

    const { error: updateError } =
      await supabase
        .from("academic_semesters")
        .update({
          start_year: startDate.year,
          start_month: startDate.month,
          start_day: startDate.day,

          end_year: endDate.year,
          end_month: endDate.month,
          end_day: endDate.day,
        })
        .eq("id", semester.id);

    if (updateError) {
      setError(
        updateError.message,
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    onSaved();
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-xl">
      <div className="bg-gradient-to-r from-[#071f45] to-[#0d3b78] p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
              <BookOpen size={14} />
              ሴሚስተር{" "}
              {toEthiopianNumber(
                semester.semester_number,
              )}
            </div>

            <h3 className="text-xl font-bold">
              {semester.name}
            </h3>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#d4af37]">
            <CalendarDays size={23} />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {!editing ? (
          <>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                <Clock3 size={15} />
                የሴሚስተሩ ጊዜ
              </div>

              {isConfigured ? (
                <p className="text-sm font-bold leading-6 text-[#172033]">
                  {formatEthiopianDateParts(
                    startDate,
                  )}{" "}
                  →{" "}
                  {formatEthiopianDateParts(
                    endDate,
                  )}
                </p>
              ) : (
                <div>
                  <p className="text-sm font-bold text-amber-700">
                    ቀኖች አልተወሰኑም
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    የሴሚስተሩን መጀመሪያና
                    መጨረሻ ቀን ከዚህ ይምረጡ።
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setEditing(true)
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0d3b78] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#092f62]"
            >
              <CalendarDays size={18} />
              {isConfigured
                ? "ቀኖችን አስተካክል"
                : "የሴሚስተሩን ቀን ይወስኑ"}
            </button>
          </>
        ) : (
          <div className="space-y-5">
            <EthiopianDatePicker
              label="የመጀመሪያ ቀን"
              value={
                startDate ??
                createEmptyDate(
                  Number(
                    yearName.match(
                      /\d+/,
                    )?.[0],
                  ) || 2019,
                )
              }
              academicYear={yearName}
              onChange={setStartDate}
            />

            <EthiopianDatePicker
              label="የመጨረሻ ቀን"
              value={
                endDate ??
                createEmptyDate(
                  Number(
                    yearName.match(
                      /\d+/,
                    )?.[0],
                  ) || 2019,
                )
              }
              academicYear={yearName}
              onChange={setEndDate}
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={17} />
                ሰርዝ
              </button>

              <button
                type="button"
                onClick={saveSemester}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d3b78] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#092f62] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                አስቀምጥ
              </button>
            </div>
          </div>
        )}

        {!editing && (
          <Link
            href={`/dashboard/academic-years/${yearId}/grades`}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-sm font-bold text-[#172033] transition hover:border-[#0d3b78]/20 hover:bg-blue-50"
          >
            <span>የሴሚስተሩን ክፍሎች ክፈት</span>
            <ChevronRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AcademicYearDetailPage() {
  const params = useParams();

  const yearId = String(
    params.id,
  );

  const supabase = createClient();

  const [year, setYear] =
    useState<AcademicYear | null>(
      null,
    );

  const [semesters, setSemesters] =
    useState<AcademicSemester[]>([]);

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);

  const [grades, setGrades] =
    useState<AcademicGrade[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showEventForm, setShowEventForm] =
    useState(false);

  const [eventSaving, setEventSaving] =
    useState(false);

  const [eventError, setEventError] =
    useState("");

  const [eventTitle, setEventTitle] =
    useState("");

  const [eventDescription, setEventDescription] =
    useState("");

  const [eventType, setEventType] =
    useState<CalendarEventType>(
      "holiday",
    );

  const [eventStart, setEventStart] =
    useState<EthiopianDate | null>(null);

  const [eventEnd, setEventEnd] =
    useState<EthiopianDate | null>(null);

  async function loadPage() {
    setLoading(true);
    setError("");

    const [
      yearResult,
      semesterResult,
      eventResult,
      gradeResult,
    ] = await Promise.all([
      supabase
        .from("academic_years")
        .select(
          "id, name, start_date, end_date, is_active",
        )
        .eq("id", yearId)
        .single(),

      supabase
        .from("academic_semesters")
        .select(
          `
            id,
            academic_year_id,
            semester_number,
            name,
            start_year,
            start_month,
            start_day,
            end_year,
            end_month,
            end_day
          `,
        )
        .eq(
          "academic_year_id",
          yearId,
        )
        .order(
          "semester_number",
          {
            ascending: true,
          },
        ),

      supabase
        .from("academic_calendar_events")
        .select(
          `
            id,
            academic_year_id,
            title,
            event_type,
            start_year,
            start_month,
            start_day,
            end_year,
            end_month,
            end_day,
            description
          `,
        )
        .eq(
          "academic_year_id",
          yearId,
        )
        .order("start_year", {
          ascending: true,
        })
        .order("start_month", {
          ascending: true,
        })
        .order("start_day", {
          ascending: true,
        }),

      supabase
        .from("academic_grades")
        .select(
          "id, academic_year_id, grade_number, name",
        )
        .eq(
          "academic_year_id",
          yearId,
        )
        .order("grade_number", {
          ascending: true,
        }),
    ]);

    if (yearResult.error) {
      setError(
        yearResult.error.message,
      );
      setLoading(false);
      return;
    }

    if (semesterResult.error) {
      setError(
        semesterResult.error.message,
      );
      setLoading(false);
      return;
    }

    if (eventResult.error) {
      setError(
        eventResult.error.message,
      );
      setLoading(false);
      return;
    }

    if (gradeResult.error) {
      setError(
        gradeResult.error.message,
      );
      setLoading(false);
      return;
    }

    setYear(
      yearResult.data as AcademicYear,
    );

    setSemesters(
      (semesterResult.data ??
        []) as AcademicSemester[],
    );

    setEvents(
      (eventResult.data ??
        []) as CalendarEvent[],
    );

    setGrades(
      (gradeResult.data ??
        []) as AcademicGrade[],
    );

    setLoading(false);
  }

  useEffect(() => {
    if (yearId) {
      loadPage();
    }
  }, [yearId]);

  const eventCount = useMemo(
    () => events.length,
    [events],
  );

  function openEventForm() {
    const academicYearNumber =
      Number(
        year?.name.match(/\d+/)?.[0],
      ) || 2019;

    const defaultDate =
      createEmptyDate(
        academicYearNumber,
      );

    setEventTitle("");
    setEventDescription("");
    setEventType("holiday");
    setEventStart(defaultDate);
    setEventEnd(defaultDate);
    setEventError("");
    setShowEventForm(true);
  }

  function closeEventForm() {
    if (eventSaving) {
      return;
    }

    setShowEventForm(false);
    setEventError("");
  }

  async function saveEvent() {
    setEventError("");

    if (
      !eventTitle.trim() ||
      !eventStart ||
      !eventEnd
    ) {
      setEventError(
        "እባክዎ ርዕስ፣ መጀመሪያ እና መጨረሻ ቀን ይሙሉ።",
      );
      return;
    }

    if (
      !isValidEthiopianDate(
        eventStart,
      ) ||
      !isValidEthiopianDate(eventEnd)
    ) {
      setEventError(
        "የተመረጠው ቀን ትክክል አይደለም።",
      );
      return;
    }

    if (
      ethiopianDateKey(eventEnd) <
      ethiopianDateKey(eventStart)
    ) {
      setEventError(
        "የመጨረሻ ቀን ከመጀመሪያ ቀን በፊት መሆን አይችልም።",
      );
      return;
    }

    setEventSaving(true);

    const { error: insertError } =
      await supabase
        .from("academic_calendar_events")
        .insert({
          academic_year_id:
            yearId,

          title:
            eventTitle.trim(),

          description:
            eventDescription.trim() ||
            null,

          event_type:
            eventType,

          start_year:
            eventStart.year,

          start_month:
            eventStart.month,

          start_day:
            eventStart.day,

          end_year:
            eventEnd.year,

          end_month:
            eventEnd.month,

          end_day:
            eventEnd.day,
        });

    if (insertError) {
      setEventError(
        insertError.message,
      );
      setEventSaving(false);
      return;
    }

    setEventSaving(false);
    setShowEventForm(false);

    await loadPage();
  }

  async function deleteEvent(
    eventId: string,
  ) {
    const confirmed =
      window.confirm(
        "ይህን የካላንደር መርሃ ግብር መሰረዝ ይፈልጋሉ?",
      );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } =
      await supabase
        .from("academic_calendar_events")
        .delete()
        .eq("id", eventId);

    if (deleteError) {
      setError(
        deleteError.message,
      );
      return;
    }

    await loadPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f5ec]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={34}
              className="animate-spin text-[#0d3b78]"
            />

            <p className="text-sm font-semibold text-gray-500">
              የትምህርት ዘመኑን በመጫን ላይ...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !year) {
    return (
      <main className="min-h-screen bg-[#f8f5ec]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/dashboard/academic-years"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#0d3b78]"
          >
            <ArrowLeft size={18} />
            ወደ የትምህርት ዘመናት
          </Link>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">
              የትምህርት ዘመኑ መጫን አልቻለም።
            </p>

            <p className="mt-2 text-sm">
              {error ||
                "የትምህርት ዘመኑ አልተገኘም።"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5ec]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* HEADER */}

        <div className="mb-8">
          <Link
            href="/dashboard/academic-years"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#0d3b78] transition hover:text-[#092f62]"
          >
            <ArrowLeft size={18} />
            ወደ የትምህርት ዘመናት
          </Link>

          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#071f45] via-[#0d3b78] to-[#1454a4] shadow-xl">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">

                    {year.is_active && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/15 px-3 py-1.5 text-xs font-bold text-green-200">
                        <CheckCircle2 size={14} />
                        ንቁ
                      </span>
                    )}

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                      የትምህርት ዘመን
                    </span>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {year.name}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                    የዚህን የትምህርት ዘመን
                    ካላንደር፣ ሴሚስተሮች፣
                    ክፍሎች፣ ኮርሶች፣
                    አባላት እና ውጤቶችን
                    ከዚህ ቦታ ያስተዳድሩ።
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm lg:min-w-[300px]">
                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af37] text-[#071f45]">
                      <CalendarDays size={24} />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-blue-100">
                        የትምህርት ዘመን
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        {year.start_date ||
                        year.end_date
                          ? "የትምህርት ዘመኑ በካላንደር ተመዝግቧል"
                          : "ቀኖች አልተወሰኑም"}
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* OVERVIEW */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0d3b78]">
                <CalendarDays size={21} />
              </div>

              <span className="text-2xl font-black text-[#172033]">
                {eventCount}
              </span>

            </div>

            <p className="mt-4 text-sm font-bold text-gray-700">
              የካላንደር መርሃ ግብሮች
            </p>

            <p className="mt-1 text-xs text-gray-500">
              በዓል፣ ዕረፍት እና ዝግ ጊዜያት
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <BookOpen size={21} />
              </div>

              <span className="text-2xl font-black text-[#172033]">
                {semesters.length}
              </span>

            </div>

            <p className="mt-4 text-sm font-bold text-gray-700">
              ሴሚስተሮች
            </p>

            <p className="mt-1 text-xs text-gray-500">
              ፩ኛ እና ፪ኛ ሴሚስተር
            </p>

          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <GraduationCap size={21} />
              </div>

              <span className="text-2xl font-black text-[#172033]">
                {grades.length}
              </span>

            </div>

            <p className="mt-4 text-sm font-bold text-gray-700">
              የክፍል ደረጃዎች
            </p>

            <p className="mt-1 text-xs text-gray-500">
              በዚህ የትምህርት ዘመን
            </p>

          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Users size={21} />
              </div>

              <span className="text-sm font-black text-[#172033]">
                Admin
              </span>

            </div>

            <p className="mt-4 text-sm font-bold text-gray-700">
              አስተዳደር
            </p>

            <p className="mt-1 text-xs text-gray-500">
              ክፍሎችንና አባላትን ያስተዳድሩ
            </p>

          </div>

        </section>

        {/* CALENDAR */}

        <section className="mb-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6 sm:p-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0d3b78]">
                  <CalendarDays size={23} />
                </div>

                <div>

                  <h2 className="text-xl font-black text-[#172033]">
                    የትምህርት ካላንደር
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    በኢትዮጵያ ዘመን የትምህርት
                    መካከለኛ ዕረፍቶች፣ በዓላት
                    እና ዝግ ጊዜያትን ይመዝግቡ።
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={openEventForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d3b78] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#092f62]"
              >
                <Plus size={17} />
                መርሃ ግብር አክል
              </button>

            </div>

          </div>

          {showEventForm && (
            <div className="border-b border-gray-100 bg-slate-50 p-6 sm:p-7">

              <div className="mb-5 flex items-start justify-between gap-4">

                <div>
                  <h3 className="text-lg font-black text-[#172033]">
                    አዲስ የካላንደር መርሃ ግብር
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    በኢትዮጵያ ዘመን የሚመዘገብ
                    ዕረፍት፣ በዓል ወይም ሌላ ጊዜ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEventForm}
                  disabled={eventSaving}
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="grid gap-5 lg:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#172033]">
                    ርዕስ
                  </label>

                  <input
                    value={eventTitle}
                    onChange={(event) =>
                      setEventTitle(
                        event.target.value,
                      )
                    }
                    placeholder="ለምሳሌ፦ የገና በዓል"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0d3b78] focus:ring-2 focus:ring-[#0d3b78]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#172033]">
                    ዓይነት
                  </label>

                  <select
                    value={eventType}
                    onChange={(event) =>
                      setEventType(
                        event.target.value as CalendarEventType,
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#0d3b78] focus:ring-2 focus:ring-[#0d3b78]/10"
                  >
                    <option value="holiday">
                      በዓል
                    </option>

                    <option value="vacation">
                      ዕረፍት
                    </option>

                    <option value="closed">
                      ዝግ ጊዜ
                    </option>

                    <option value="event">
                      መርሃ ግብር
                    </option>

                    <option value="other">
                      ሌላ
                    </option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-[#172033]">
                    መግለጫ
                  </label>

                  <textarea
                    value={eventDescription}
                    onChange={(event) =>
                      setEventDescription(
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="አስፈላጊ ከሆነ ተጨማሪ መግለጫ ይጻፉ..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0d3b78] focus:ring-2 focus:ring-[#0d3b78]/10"
                  />
                </div>

                <EthiopianDatePicker
                  label="መጀመሪያ"
                  value={eventStart}
                  academicYear={
                    year.name
                  }
                  onChange={setEventStart}
                />

                <EthiopianDatePicker
                  label="መጨረሻ"
                  value={eventEnd}
                  academicYear={
                    year.name
                  }
                  onChange={setEventEnd}
                />

              </div>

              {eventError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {eventError}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeEventForm}
                  disabled={eventSaving}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  ሰርዝ
                </button>

                <button
                  type="button"
                  onClick={saveEvent}
                  disabled={eventSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0d3b78] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#092f62] disabled:opacity-50"
                >
                  {eventSaving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  አስቀምጥ
                </button>

              </div>

            </div>
          )}

          {events.length > 0 && (
            <div className="divide-y divide-gray-100">

              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-bold text-[#172033]">
                        {event.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getEventTypeStyle(
                          event.event_type,
                        )}`}
                      >
                        {getEventTypeLabel(
                          event.event_type,
                        )}
                      </span>

                    </div>

                    {event.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {event.description}
                      </p>
                    )}

                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      {formatEthiopianDateParts(
                        getEventStartDate(
                          event,
                        ),
                      )}{" "}
                      →{" "}
                      {formatEthiopianDateParts(
                        getEventEndDate(
                          event,
                        ),
                      )}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      deleteEvent(
                        event.id,
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 sm:self-center"
                  >
                    <Trash2 size={15} />
                    ሰርዝ
                  </button>

                </div>
              ))}

            </div>
          )}

          {events.length === 0 &&
            !showEventForm && (
              <div className="p-8 text-center">
                <CalendarDays
                  size={34}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 font-bold text-gray-500">
                  እስካሁን የካላንደር መርሃ ግብር
                  አልተጨመረም።
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  በዓላትን፣ ዕረፍቶችን እና
                  ዝግ ጊዜያትን ከላይ ባለው
                  አዝራር ይጨምሩ።
                </p>
              </div>
            )}

        </section>

        {/* SEMESTERS */}

        <section className="mb-8">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-2xl font-black text-[#172033]">
                የትምህርት ሴሚስተሮች
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                የእያንዳንዱን ሴሚስተር
                የኢትዮጵያ ቀን ይወስኑ።
              </p>
            </div>

          </div>

          {semesters.length === 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800">
              ለዚህ የትምህርት ዘመን
              ሴሚስተሮች አልተፈጠሩም።
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">

              {semesters.map(
                (semester) => (
                  <SemesterCard
                    key={semester.id}
                    semester={semester}
                    yearId={year.id}
                    yearName={year.name}
                    onSaved={loadPage}
                  />
                ),
              )}

            </div>
          )}

        </section>

        {/* GRADES */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

          <div className="mb-6 flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <GraduationCap size={23} />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#172033]">
                የክፍል ደረጃዎች
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                አባላትን፣ ኮርሶችን፣
                አስተማሪዎችን እና ውጤቶችን
                ለማስተዳደር ክፍል ይምረጡ።
              </p>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

            {grades.map((grade) => (
              <Link
                key={grade.id}
                href={`/dashboard/academic-years/${year.id}/grades/${grade.id}/courses`}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center transition hover:-translate-y-0.5 hover:border-[#0d3b78]/20 hover:bg-blue-50 hover:shadow-sm"
              >

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0d3b78] shadow-sm transition group-hover:bg-[#0d3b78] group-hover:text-white">
                  <GraduationCap size={21} />
                </div>

                <p className="mt-3 text-sm font-black text-[#172033]">
                  {toEthiopianNumber(
                    grade.grade_number,
                  )}
                  ኛ ክፍል
                </p>

              </Link>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}
