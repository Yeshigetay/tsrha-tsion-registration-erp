
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  X,
  BookOpen,
  ExternalLink,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import BackToHomeButton from "@/components/layout/BackToHomeButton";

/* ================================================================
   TYPES
================================================================ */

type AcademicYear = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type EthiopianDate = {
  year: number;
  month: number;
  day: number;
};

type FormData = {
  name: string;
  startDate: EthiopianDate;
  endDate: EthiopianDate;
  is_active: boolean;
};

type CalendarPickerProps = {
  value: EthiopianDate;
  onChange: (date: EthiopianDate) => void;
  label: string;
};

/* ================================================================
   ETHIOPIAN CALENDAR
================================================================ */

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

const WEEK_DAYS = [
  "ሰኞ",
  "ማክሰኞ",
  "ረቡዕ",
  "ሐሙስ",
  "ዓርብ",
  "ቅዳሜ",
  "እሁድ",
];

function isEthiopianLeapYear(year: number) {
  return (year + 1) % 4 === 0;
}

function getEthiopianMonthDays(
  year: number,
  month: number,
) {
  if (month >= 1 && month <= 12) {
    return 30;
  }

  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }

  return 0;
}

/* ================================================================
   DATE CONVERSION
================================================================ */

const ETHIOPIAN_EPOCH_YEAR = 2011;

const ETHIOPIAN_EPOCH_GREGORIAN = {
  year: 2018,
  month: 9,
  day: 11,
};

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

function createUtcDate(
  year: number,
  month: number,
  day: number,
) {
  return new Date(
    Date.UTC(year, month - 1, day),
  );
}

function formatGregorianDate(date: Date) {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseGregorianDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const parts = value
    .split("-")
    .map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return createUtcDate(
    year,
    month,
    day,
  );
}

function countLeapYearsBetween(
  startYear: number,
  endYear: number,
) {
  if (endYear < startYear) {
    return 0;
  }

  let count = 0;

  for (
    let year = startYear;
    year <= endYear;
    year++
  ) {
    if (isEthiopianLeapYear(year)) {
      count++;
    }
  }

  return count;
}

function ethiopianDateToDayOffset(
  date: EthiopianDate,
) {
  const fullYears =
    date.year -
    ETHIOPIAN_EPOCH_YEAR;

  let days = fullYears * 365;

  if (fullYears > 0) {
    days += countLeapYearsBetween(
      ETHIOPIAN_EPOCH_YEAR,
      date.year - 1,
    );
  } else if (fullYears < 0) {
    days -= countLeapYearsBetween(
      date.year,
      ETHIOPIAN_EPOCH_YEAR - 1,
    );
  }

  days +=
    (date.month - 1) * 30;

  days += date.day - 1;

  return days;
}

function ethiopianToGregorian(
  date: EthiopianDate,
) {
  const epoch = createUtcDate(
    ETHIOPIAN_EPOCH_GREGORIAN.year,
    ETHIOPIAN_EPOCH_GREGORIAN.month,
    ETHIOPIAN_EPOCH_GREGORIAN.day,
  );

  const offset =
    ethiopianDateToDayOffset(date);

  return new Date(
    epoch.getTime() +
      offset * MILLISECONDS_PER_DAY,
  );
}

function ethiopianToGregorianString(
  date: EthiopianDate,
) {
  return formatGregorianDate(
    ethiopianToGregorian(date),
  );
}

function gregorianToEthiopian(
  gregorian: Date,
): EthiopianDate {
  const epoch = createUtcDate(
    ETHIOPIAN_EPOCH_GREGORIAN.year,
    ETHIOPIAN_EPOCH_GREGORIAN.month,
    ETHIOPIAN_EPOCH_GREGORIAN.day,
  );

  const difference = Math.floor(
    (gregorian.getTime() -
      epoch.getTime()) /
      MILLISECONDS_PER_DAY,
  );

  let ethiopianYear =
    ETHIOPIAN_EPOCH_YEAR +
    Math.floor(difference / 365);

  while (
    ethiopianDateToDayOffset({
      year: ethiopianYear + 1,
      month: 1,
      day: 1,
    }) <= difference
  ) {
    ethiopianYear++;
  }

  while (
    ethiopianDateToDayOffset({
      year: ethiopianYear,
      month: 1,
      day: 1,
    }) > difference
  ) {
    ethiopianYear--;
  }

  const yearStartOffset =
    ethiopianDateToDayOffset({
      year: ethiopianYear,
      month: 1,
      day: 1,
    });

  const dayOfYear =
    difference - yearStartOffset;

  let month =
    Math.floor(dayOfYear / 30) + 1;

  let day =
    (dayOfYear % 30) + 1;

  if (month > 13) {
    month = 13;
    day = getEthiopianMonthDays(
      ethiopianYear,
      13,
    );
  }

  return {
    year: ethiopianYear,
    month,
    day,
  };
}

function gregorianStringToEthiopian(
  value: string | null,
) {
  const date =
    parseGregorianDate(value);

  if (!date) {
    return null;
  }

  return gregorianToEthiopian(date);
}

function compareEthiopianDates(
  first: EthiopianDate,
  second: EthiopianDate,
) {
  return (
    ethiopianDateToDayOffset(first) -
    ethiopianDateToDayOffset(second)
  );
}

function formatEthiopianDate(
  date: EthiopianDate,
) {
  return `${date.year} ዓ.ም — ${
    ETHIOPIAN_MONTHS[date.month - 1]
  } ${date.day}`;
}

function getCurrentEthiopianDate(): EthiopianDate {
  const now = new Date();

  const utcDate = createUtcDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  return gregorianToEthiopian(
    utcDate,
  );
}

/* ================================================================
   ETHIOPIAN CALENDAR PICKER
================================================================ */

function EthiopianCalendarPicker({
  value,
  onChange,
  label,
}: CalendarPickerProps) {
  const [open, setOpen] =
    useState(false);

  const [viewYear, setViewYear] =
    useState(value.year);

  const [viewMonth, setViewMonth] =
    useState(value.month);

  useEffect(() => {
    setViewYear(value.year);
    setViewMonth(value.month);
  }, [value.year, value.month]);

  const daysInMonth =
    getEthiopianMonthDays(
      viewYear,
      viewMonth,
    );

  const firstGregorianDate =
    ethiopianToGregorian({
      year: viewYear,
      month: viewMonth,
      day: 1,
    });

  const mondayFirstOffset =
    (firstGregorianDate.getUTCDay() + 6) %
    7;

  function previousMonth() {
    if (viewMonth === 1) {
      setViewYear(
        (year) => year - 1,
      );
      setViewMonth(13);
    } else {
      setViewMonth(
        (month) => month - 1,
      );
    }
  }

  function nextMonth() {
    if (viewMonth === 13) {
      setViewYear(
        (year) => year + 1,
      );
      setViewMonth(1);
    } else {
      setViewMonth(
        (month) => month + 1,
      );
    }
  }

  function selectDay(day: number) {
    onChange({
      year: viewYear,
      month: viewMonth,
      day,
    });

    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left transition hover:border-[#0d3b78] hover:bg-white"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d3b78] text-[#d4af37]">
            <CalendarDays size={19} />
          </div>

          <div>
            <p className="text-xs text-gray-400">
              የኢትዮጵያ ዘመን
            </p>

            <p className="font-bold text-[#172033]">
              {formatEthiopianDate(value)}
            </p>
          </div>
        </div>

        <ChevronRight
          size={18}
          className={`text-gray-400 transition ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-[#071f45] to-[#0d3b78] px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={previousMonth}
                className="rounded-xl p-2 hover:bg-white/10"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-center">
                <p className="text-lg font-bold">
                  {
                    ETHIOPIAN_MONTHS[
                      viewMonth - 1
                    ]
                  }
                </p>

                <p className="text-sm text-blue-100">
                  {viewYear} ዓ.ም
                </p>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="rounded-xl p-2 hover:bg-white/10"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setViewYear(
                    (year) => year - 1,
                  )
                }
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                −
              </button>

              <span className="min-w-24 text-center text-sm font-bold">
                {viewYear} ዓ.ም
              </span>

              <button
                type="button"
                onClick={() =>
                  setViewYear(
                    (year) => year + 1,
                  )
                }
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 px-3 py-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-bold text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 p-3">
            {Array.from({
              length: mondayFirstOffset,
            }).map((_, index) => (
              <div
                key={`empty-${index}`}
              />
            ))}

            {Array.from(
              {
                length: daysInMonth,
              },
              (_, index) => index + 1,
            ).map((day) => {
              const selected =
                value.year === viewYear &&
                value.month === viewMonth &&
                value.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    selectDay(day)
                  }
                  className={`aspect-square rounded-xl text-sm font-semibold transition ${
                    selected
                      ? "bg-[#0d3b78] text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-50 hover:text-[#0d3b78]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-center text-xs text-gray-500">
              {daysInMonth} ቀናት
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PAGE
================================================================ */

export default function AcademicYearsPage() {
  const supabase = createClient();

  const currentEthiopianDate =
    getCurrentEthiopianDate();

  const [years, setYears] =
    useState<AcademicYear[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingYear, setEditingYear] =
    useState<AcademicYear | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState<FormData>({
      name: "",
      startDate: {
        year:
          currentEthiopianDate.year,
        month: 1,
        day: 1,
      },
      endDate: {
        year:
          currentEthiopianDate.year,
        month: 13,
        day: isEthiopianLeapYear(
          currentEthiopianDate.year,
        )
          ? 6
          : 5,
      },
      is_active: false,
    });

  const activeYear = useMemo(
    () =>
      years.find(
        (year) => year.is_active,
      ),
    [years],
  );

  /* ================================================================
     LOAD
  ================================================================ */

  async function loadYears(
    showRefresh = false,
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const {
      data,
      error: loadError,
    } = await supabase
      .from("academic_years")
      .select("*")
      .order("start_date", {
        ascending: false,
      });

    if (loadError) {
      setError(loadError.message);
      setYears([]);
    } else {
      setYears(
        (data ?? []) as AcademicYear[],
      );
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadYears();
  }, []);

  /* ================================================================
     ADD
  ================================================================ */

  function openAddForm() {
    const nextYear = activeYear
      ? Number(
          activeYear.name.match(
            /\d+/,
          )?.[0] ??
            currentEthiopianDate.year,
        ) + 1
      : currentEthiopianDate.year;

    setEditingYear(null);

    setForm({
      name: `${nextYear} ዓ.ም`,
      startDate: {
        year: nextYear,
        month: 1,
        day: 1,
      },
      endDate: {
        year: nextYear,
        month: 13,
        day: isEthiopianLeapYear(
          nextYear,
        )
          ? 6
          : 5,
      },
      is_active: false,
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  /* ================================================================
     EDIT
  ================================================================ */

  function openEditForm(
    year: AcademicYear,
  ) {
    const startDate =
      gregorianStringToEthiopian(
        year.start_date,
      );

    const endDate =
      gregorianStringToEthiopian(
        year.end_date,
      );

    setEditingYear(year);

    setForm({
      name: year.name,

      startDate:
        startDate ?? {
          year:
            currentEthiopianDate.year,
          month: 1,
          day: 1,
        },

      endDate:
        endDate ?? {
          year:
            currentEthiopianDate.year,
          month: 13,
          day: isEthiopianLeapYear(
            currentEthiopianDate.year,
          )
            ? 6
            : 5,
        },

      is_active: year.is_active,
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingYear(null);
    setError("");
  }

  /* ================================================================
     DATE UPDATE
  ================================================================ */

  function updateStartDate(
    date: EthiopianDate,
  ) {
    setForm((current) => ({
      ...current,
      startDate: date,
      name: `${date.year} ዓ.ም`,
    }));
  }

  function updateEndDate(
    date: EthiopianDate,
  ) {
    setForm((current) => ({
      ...current,
      endDate: date,
    }));
  }

  /* ================================================================
     SAVE
  ================================================================ */

  async function saveYear() {
    setMessage("");
    setError("");

    const startDays =
      getEthiopianMonthDays(
        form.startDate.year,
        form.startDate.month,
      );

    const endDays =
      getEthiopianMonthDays(
        form.endDate.year,
        form.endDate.month,
      );

    if (
      form.startDate.day < 1 ||
      form.startDate.day > startDays
    ) {
      setError(
        "የመጀመሪያ ቀን ትክክል አይደለም።",
      );
      return;
    }

    if (
      form.endDate.day < 1 ||
      form.endDate.day > endDays
    ) {
      setError(
        "የመጨረሻ ቀን ትክክል አይደለም።",
      );
      return;
    }

    if (
      compareEthiopianDates(
        form.startDate,
        form.endDate,
      ) > 0
    ) {
      setError(
        "የመጀመሪያ ቀን ከመጨረሻ ቀን በኋላ መሆን አይችልም።",
      );
      return;
    }

    if (!form.name.trim()) {
      setError(
        "የትምህርት ዘመኑ ስም ያስፈልጋል።",
      );
      return;
    }

    setSaving(true);

    try {
      if (form.is_active) {
        const {
          error: deactivateError,
        } = await supabase
          .from("academic_years")
          .update({
            is_active: false,
          })
          .neq(
            "id",
            editingYear?.id ??
              "00000000-0000-0000-0000-000000000000",
          );

        if (deactivateError) {
          throw new Error(
            deactivateError.message,
          );
        }
      }

      const payload = {
        name: form.name.trim(),
        start_date:
          ethiopianToGregorianString(
            form.startDate,
          ),
        end_date:
          ethiopianToGregorianString(
            form.endDate,
          ),
        is_active: form.is_active,
      };

      if (editingYear) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("academic_years")
          .update(payload)
          .eq(
            "id",
            editingYear.id,
          )
          .select()
          .single();

        if (updateError) {
          throw new Error(
            updateError.message,
          );
        }

        setYears((current) =>
          current.map((year) => {
            if (
              year.id === data.id
            ) {
              return data as AcademicYear;
            }

            if (form.is_active) {
              return {
                ...year,
                is_active: false,
              };
            }

            return year;
          }),
        );

        setMessage(
          "የትምህርት ዘመኑ በተሳካ ሁኔታ ተስተካክሏል።",
        );
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("academic_years")
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          throw new Error(
            insertError.message,
          );
        }

        setYears((current) => {
          const updated =
            form.is_active
              ? current.map(
                  (year) => ({
                    ...year,
                    is_active: false,
                  }),
                )
              : current;

          return [
            data as AcademicYear,
            ...updated,
          ];
        });

        setMessage(
          "አዲሱ የትምህርት ዘመን ተጨምሯል።",
        );
      }

      setShowForm(false);
      setEditingYear(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "የትምህርት ዘመኑን ማስቀመጥ አልተቻለም።",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ================================================================
     ACTIVATE
  ================================================================ */

  async function setActiveYear(
    year: AcademicYear,
  ) {
    setMessage("");
    setError("");

    if (year.is_active) {
      return;
    }

    const confirmed =
      window.confirm(
        `“${year.name}”ን ንቁ የትምህርት ዘመን ማድረግ ይፈልጋሉ?`,
      );

    if (!confirmed) {
      return;
    }

    const {
      error: deactivateError,
    } = await supabase
      .from("academic_years")
      .update({
        is_active: false,
      })
      .neq("id", year.id);

    if (deactivateError) {
      setError(
        deactivateError.message,
      );
      return;
    }

    const {
      error: activateError,
    } = await supabase
      .from("academic_years")
      .update({
        is_active: true,
      })
      .eq("id", year.id);

    if (activateError) {
      setError(
        activateError.message,
      );
      return;
    }

    setYears((current) =>
      current.map((item) => ({
        ...item,
        is_active:
          item.id === year.id,
      })),
    );

    setMessage(
      `“${year.name}” ንቁ የትምህርት ዘመን ሆኗል።`,
    );
  }

  /* ================================================================
     DELETE
  ================================================================ */

  async function deleteYear(
    year: AcademicYear,
  ) {
    setMessage("");
    setError("");

    if (year.is_active) {
      setError(
        "ንቁ የሆነ የትምህርት ዘመን መሰረዝ አይቻልም።",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `“${year.name}”ን መሰረዝ ይፈልጋሉ?\n\nይህ ሂደት ሊቀለበስ አይችልም።`,
      );

    if (!confirmed) {
      return;
    }

    const {
      error: deleteError,
    } = await supabase
      .from("academic_years")
      .delete()
      .eq("id", year.id);

    if (deleteError) {
      setError(
        deleteError.message,
      );
      return;
    }

    setYears((current) =>
      current.filter(
        (item) =>
          item.id !== year.id,
      ),
    );

    setMessage(
      "የትምህርት ዘመኑ ተሰርዟል።",
    );
  }

  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#172033]">
      {/* HEADER */}

      <header className="border-b border-white/10 bg-gradient-to-r from-[#071f45] via-[#0d3b78] to-[#1454a4] text-white shadow-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-white/10">
                <CalendarDays
                  size={28}
                  className="text-[#d4af37]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-blue-100">
                  ጽርሐ ጽዮን ሰንበት ት/ቤት
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  የትምህርት ዘመን
                </h1>

                <p className="mt-1 text-sm text-blue-100">
                  የትምህርት ዘመናትን ያስተዳድሩ
                </p>
              </div>
            </div>

            <BackToHomeButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ACTIONS */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              የትምህርት ዘመናት
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              የአባላትን የትምህርት ታሪክ በየዓመቱ ለማስተዳደር።
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                loadYears(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0d3b78] shadow-sm transition hover:border-[#0d3b78] hover:bg-blue-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              አድስ
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d3b78] to-[#1454a4] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              አዲስ ዓመት
            </button>
          </div>
        </div>

        {/* MESSAGES */}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">
            <CheckCircle2 size={20} />
            {message}
          </div>
        )}

        {error && !showForm && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* ACTIVE YEAR */}

        <section className="mb-8 overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#fffdf5] via-white to-[#f8f5ec] shadow-lg">
          <div className="border-b border-[#d4af37]/20 bg-[#d4af37]/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <Star
                size={18}
                className="fill-[#d4af37] text-[#b89018]"
              />

              <h2 className="font-bold text-[#0d3b78]">
                ንቁ የትምህርት ዘመን
              </h2>
            </div>
          </div>

          <div className="p-6">
            {activeYear ? (
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold">
                      {activeYear.name}
                    </h3>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      <CheckCircle2
                        size={14}
                      />
                      ንቁ
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                    <span>
                      መጀመሪያ:{" "}
                      <strong className="text-gray-700">
                        {formatEthiopianDate(
                          gregorianStringToEthiopian(
                            activeYear.start_date,
                          ) ?? {
                            year: 0,
                            month: 1,
                            day: 1,
                          },
                        )}
                      </strong>
                    </span>

                    <span>
                      መጨረሻ:{" "}
                      <strong className="text-gray-700">
                        {formatEthiopianDate(
                          gregorianStringToEthiopian(
                            activeYear.end_date,
                          ) ?? {
                            year: 0,
                            month: 1,
                            day: 1,
                          },
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/academic-years/${activeYear.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0d3b78] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#092f62]"
                >
                  <ExternalLink size={17} />
                  የትምህርት ዘመኑን ክፈት
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d4af37]/50 bg-white px-6 py-10 text-center">
                <CalendarDays
                  size={48}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-4 text-lg font-bold text-gray-700">
                  ንቁ የትምህርት ዘመን የለም
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  ለመጀመር አዲስ የትምህርት ዘመን ይፍጠሩ።
                </p>
              </div>
            )}
          </div>
        </section>

        {/* YEARS */}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                የተመዘገቡ የትምህርት ዘመናት
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {years.length} የትምህርት ዘመን
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-20">
              <RefreshCw
                size={28}
                className="animate-spin text-[#0d3b78]"
              />
            </div>
          ) : years.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <CalendarDays
                size={48}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 text-lg font-bold text-gray-700">
                የትምህርት ዘመን አልተገኘም
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                የመጀመሪያውን የትምህርት ዘመን ለመጨመር “አዲስ ዓመት” ይጫኑ።
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {years.map((year) => {
                const start =
                  gregorianStringToEthiopian(
                    year.start_date,
                  );

                const end =
                  gregorianStringToEthiopian(
                    year.end_date,
                  );

                return (
                  <div
                    key={year.id}
                    className={`group p-6 transition ${
                      year.is_active
                        ? "bg-blue-50/50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            year.is_active
                              ? "bg-[#0d3b78] text-[#d4af37]"
                              : "bg-gray-100 text-[#0d3b78]"
                          }`}
                        >
                          <CalendarDays
                            size={22}
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold">
                              {year.name}
                            </h3>

                            {year.is_active && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                <CheckCircle2
                                  size={13}
                                />
                                ንቁ
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                            <span>
                              መጀመሪያ:{" "}
                              <strong className="text-gray-700">
                                {start
                                  ? formatEthiopianDate(
                                      start,
                                    )
                                  : "—"}
                              </strong>
                            </span>

                            <span>
                              መጨረሻ:{" "}
                              <strong className="text-gray-700">
                                {end
                                  ? formatEthiopianDate(
                                      end,
                                    )
                                  : "—"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* NEW OPEN BUTTON */}

                        <Link
                          href={`/dashboard/academic-years/${year.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d3b78] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#092f62]"
                        >
                          <ExternalLink
                            size={16}
                          />
                          የትምህርት ዘመኑን ክፈት
                        </Link>

                        {!year.is_active && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveYear(
                                year,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            <CheckCircle2
                              size={16}
                            />
                            ንቁ አድርግ
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              year,
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-[#0d3b78] transition hover:bg-blue-100"
                        >
                          <Edit3 size={16} />
                          አስተካክል
                        </button>

                        {!year.is_active && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteYear(
                                year,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2
                              size={16}
                            />
                            ሰርዝ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-white px-5 py-4 text-center text-sm text-gray-500 shadow-sm">
          የትምህርት ዘመን ከተፈጠረ በኋላ አባላትን ወደ የክፍል ደረጃዎች መመደብ ይችላሉ።
        </div>
      </div>

      {/* ================================================================
          ADD / EDIT MODAL
      ================================================================ */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f45]/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#071f45] to-[#0d3b78] px-6 py-5 text-white">
              <div>
                <h2 className="text-xl font-bold">
                  {editingYear
                    ? "የትምህርት ዘመን አስተካክል"
                    : "አዲስ የትምህርት ዘመን"}
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  ቀኖችን በኢትዮጵያ ዘመን አቆጣጠር ይምረጡ
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-blue-100 hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  የትምህርት ዘመን
                </label>

                <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#fffdf5] to-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d3b78] text-[#d4af37]">
                      <BookOpen size={21} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        የትምህርት ዘመን
                      </p>

                      <p className="text-xl font-bold text-[#0d3b78]">
                        {form.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <EthiopianCalendarPicker
                  label="የመጀመሪያ ቀን"
                  value={
                    form.startDate
                  }
                  onChange={
                    updateStartDate
                  }
                />

                <EthiopianCalendarPicker
                  label="የመጨረሻ ቀን"
                  value={
                    form.endDate
                  }
                  onChange={
                    updateEndDate
                  }
                />
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays
                    size={18}
                    className="text-[#0d3b78]"
                  />

                  <p className="font-bold text-[#0d3b78]">
                    የተመረጠው የትምህርት ዘመን
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-400">
                      መጀመሪያ
                    </p>

                    <p className="mt-1 font-bold text-gray-700">
                      {formatEthiopianDate(
                        form.startDate,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-400">
                      መጨረሻ
                    </p>

                    <p className="mt-1 font-bold text-gray-700">
                      {formatEthiopianDate(
                        form.endDate,
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  ቀኖቹ በSupabase ውስጥ እንደ PostgreSQL date
                  ይቀመጣሉ። በድረ-ገጹ ግን በኢትዮጵያዊ
                  አቆጣጠር ይታያሉ።
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#d4af37]/30 bg-[#fffdf5] p-4">
                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target
                            .checked,
                      }),
                    )
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 accent-[#0d3b78]"
                />

                <div>
                  <p className="font-bold">
                    ይህን ዓመት ንቁ አድርግ
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    ንቁ ዓመት አንድ ብቻ ይኖራል።
                  </p>
                </div>
              </label>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                ሰርዝ
              </button>

              <button
                type="button"
                onClick={saveYear}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d3b78] to-[#1454a4] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    በማስቀመጥ ላይ...
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      size={17}
                    />

                    {editingYear
                      ? "ለውጡን አስቀምጥ"
                      : "የትምህርት ዘመን ፍጠር"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
