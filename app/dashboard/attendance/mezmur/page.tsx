
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused";

type MezmurGroup = {
  id: string;
  code: string;
  name: string;
  grade_number: number | null;
  sort_order: number;
};

type Member = {
  id: string;
  member_id: string;
  group_id: string;
  active: boolean;
  member: {
    id: string;
    first_name: string;
    father_name: string;
    grandfather_name: string;
    gender: "male" | "female";
    registration_number: string;
    phone: string | null;
  } | null;
};

type ExistingMember = {
  id: string;
  first_name: string;
  father_name: string;
  grandfather_name: string;
  gender: "male" | "female";
  registration_number: string;
  phone: string | null;
  member_photo_path: string | null;
};

type AttendanceRecord = {
  mezmur_member_id: string;
  attendance_date: string;
  status: AttendanceStatus;
};

type HistoryRow = {
  id: string;
  attendance_date: string;
  status: AttendanceStatus;
  memberId: string;
  memberName: string;
  registrationNumber: string;
};

type EthiopianDate = {
  year: number;
  month: number;
  day: number;
  value: string;
};

type GroupDailyStats = {
  members: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

const supabase = createClient();

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

const STATUS_LABELS: Record<
  AttendanceStatus,
  string
> = {
  present: "ተገኝቷል/ታለች",
  absent: "አልተገኘም/አልተገኘችም",
  late: "ዘግይቷል/ዘግይታለች",
  excused: "ፈቃድ",
};

const STATUS_STYLES: Record<
  AttendanceStatus,
  {
    active: string;
    inactive: string;
    dot: string;
  }
> = {
  present: {
    active:
      "border-emerald-500 bg-emerald-50 text-emerald-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50",
    dot: "bg-emerald-500",
  },
  absent: {
    active:
      "border-rose-500 bg-rose-50 text-rose-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50",
    dot: "bg-rose-500",
  },
  late: {
    active:
      "border-amber-500 bg-amber-50 text-amber-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50",
    dot: "bg-amber-500",
  },
  excused: {
    active:
      "border-violet-500 bg-violet-50 text-violet-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:bg-violet-50",
    dot: "bg-violet-500",
  },
};

function getEthiopianDate(
  date: Date,
): EthiopianDate {
  const formatter = new Intl.DateTimeFormat(
    "en-US-u-ca-ethiopic-nu-latn",
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    },
  );

  const parts =
    formatter.formatToParts(date);

  const year = Number(
    parts.find(
      (part) => part.type === "year",
    )?.value ?? 0,
  );

  const month = Number(
    parts.find(
      (part) => part.type === "month",
    )?.value ?? 0,
  );

  const day = Number(
    parts.find(
      (part) => part.type === "day",
    )?.value ?? 0,
  );

  return {
    year,
    month,
    day,
    value: `${year}-${String(year === 0 ? 0 : month).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`,
  };
}

function formatEthiopianDate(
  dateString: string,
) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return dateString;
  }

  return `${day} ${
    ETHIOPIAN_MONTHS[month - 1] ?? ""
  } ${year}`;
}

function getEthiopianDaysInMonth(
  year: number,
  month: number,
) {
  if (month >= 1 && month <= 12) {
    return 30;
  }

  if (month === 13) {
    return (year + 1) % 4 === 0
      ? 6
      : 5;
  }

  return 30;
}

function getEthiopianYears() {
  const current = getEthiopianDate(
    new Date(),
  );

  const years: number[] = [];

  for (
    let year = current.year - 10;
    year <= current.year + 2;
    year++
  ) {
    years.push(year);
  }

  return years.reverse();
}

function getEthiopianNumber(
  value: number,
) {
  const numbers: Record<
    number,
    string
  > = {
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
    13: "፲፫",
    14: "፲፬",
    15: "፲፭",
    16: "፲፮",
    17: "፲፯",
    18: "፲፰",
    19: "፲፱",
    20: "፳",
    21: "፳፩",
    22: "፳፪",
    23: "፳፫",
    24: "፳፬",
    25: "፳፭",
    26: "፳፮",
    27: "፳፯",
    28: "፳፰",
    29: "፳፱",
    30: "፴",
  };

  return numbers[value] ?? String(value);
}

function getGroupDisplayName(
  group: MezmurGroup,
) {
  const code =
    group.code.trim().toLowerCase();

  const name = group.name.trim();

  if (
    code === "youth" ||
    code === "young" ||
    name.includes("ወጣት")
  ) {
    return "ወጣት";
  }

  if (
    group.grade_number === 5 ||
    code === "grade_5" ||
    code === "5" ||
    name.includes("፭")
  ) {
    return "፭ኛ ክፍል";
  }

  if (
    group.grade_number === 6 ||
    code === "grade_6" ||
    code === "6" ||
    name.includes("፮")
  ) {
    return "፮ኛ ክፍል";
  }

  if (
    group.grade_number === 7 ||
    code === "grade_7" ||
    code === "7" ||
    name.includes("፯")
  ) {
    return "፯ኛ ክፍል";
  }

  return name;
}

function getAllowedGroupType(
  group: MezmurGroup,
):
  | "grade5"
  | "grade6"
  | "grade7"
  | "youth"
  | null {
  const code =
    group.code.trim().toLowerCase();

  const name = group.name.trim();

  if (
    group.grade_number === 5 ||
    code === "grade_5" ||
    code === "5" ||
    name.includes("፭")
  ) {
    return "grade5";
  }

  if (
    group.grade_number === 6 ||
    code === "grade_6" ||
    code === "6" ||
    name.includes("፮")
  ) {
    return "grade6";
  }

  if (
    group.grade_number === 7 ||
    code === "grade_7" ||
    code === "7" ||
    name.includes("፯")
  ) {
    return "grade7";
  }

  if (
    code === "youth" ||
    code === "young" ||
    name.includes("ወጣት")
  ) {
    return "youth";
  }

  return null;
}

function changeGregorianDay(
  date: Date,
  amount: number,
) {
  const next = new Date(date);

  next.setDate(
    next.getDate() + amount,
  );

  const current = new Date();

  current.setHours(
    0,
    0,
    0,
    0,
  );

  next.setHours(
    0,
    0,
    0,
    0,
  );

  if (next > current) {
    return current;
  }

  return next;
}

function isFutureEthiopianDate(
  year: number,
  month: number,
  day: number,
) {
  const current =
    getEthiopianDate(new Date());

  if (year > current.year) {
    return true;
  }

  if (year < current.year) {
    return false;
  }

  if (month > current.month) {
    return true;
  }

  if (month < current.month) {
    return false;
  }

  return day > current.day;
}

export default function MezmurAttendancePage() {
  const today = useMemo(
    () => getEthiopianDate(new Date()),
    [],
  );

  const [groups, setGroups] =
    useState<MezmurGroup[]>([]);

  const [selectedGroupId, setSelectedGroupId] =
    useState<string | null>(null);

  const [selectedDate, setSelectedDate] =
    useState(today.value);

  const [
    selectedGregorianDate,
    setSelectedGregorianDate,
  ] = useState<Date>(new Date());

  const [members, setMembers] =
    useState<Member[]>([]);

  const [existingMembers, setExistingMembers] =
    useState<ExistingMember[]>([]);

  const [attendance, setAttendance] =
    useState<
      Record<
        string,
        AttendanceStatus
      >
    >({});

  const [
    savedAttendance,
    setSavedAttendance,
  ] = useState<
    Record<
      string,
      AttendanceStatus
    >
  >({});

  const [
    historyRecords,
    setHistoryRecords,
  ] = useState<HistoryRow[]>([]);

  const [
    historyEdits,
    setHistoryEdits,
  ] = useState<
    Record<string, AttendanceStatus>
  >({});

  const [
    groupDailyStats,
    setGroupDailyStats,
  ] = useState<
    Record<string, GroupDailyStats>
  >({});

  const [memberSearch, setMemberSearch] =
    useState("");

  const [
    addMemberSearch,
    setAddMemberSearch,
  ] = useState("");

  const [
    historySearch,
    setHistorySearch,
  ] = useState("");

  const [
    historyYear,
    setHistoryYear,
  ] = useState(String(today.year));

  const [
    historyMonth,
    setHistoryMonth,
  ] = useState(String(today.month));

  const [
    historyDay,
    setHistoryDay,
  ] = useState(String(today.day));

  const [
    showAddMember,
    setShowAddMember,
  ] = useState(false);

  const [
    showHistory,
    setShowHistory,
  ] = useState(false);

  const [
    loadingGroups,
    setLoadingGroups,
  ] = useState(true);

  const [
    loadingMembers,
    setLoadingMembers,
  ] = useState(false);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] = useState(false);

  const [
    loadingExistingMembers,
    setLoadingExistingMembers,
  ] = useState(false);

  const [addMemberError, setAddMemberError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    searchingHistory,
    setSearchingHistory,
  ] = useState(false);

  const [
    savingHistory,
    setSavingHistory,
  ] = useState(false);

  const [permissionRecordId, setPermissionRecordId] =
    useState<string | null>(null);
  const [permissionTargetType, setPermissionTargetType] =
    useState<"daily" | "history" | null>(null);
  const [permissionPendingStatus, setPermissionPendingStatus] =
    useState<AttendanceStatus | null>(null);
  const [permissionPassword, setPermissionPassword] =
    useState("");
  const [permissionError, setPermissionError] =
    useState("");
  const [verifyingPermission, setVerifyingPermission] =
    useState(false);

  const [showClearDatePassword, setShowClearDatePassword] =
    useState(false);
  const [clearDatePassword, setClearDatePassword] =
    useState("");
  const [clearDateError, setClearDateError] =
    useState("");
  const [clearingDateHistory, setClearingDateHistory] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (group) =>
          group.id ===
          selectedGroupId,
      ) ?? null,
    [groups, selectedGroupId],
  );

  const isToday =
    selectedDate === today.value;

  const currentEthiopianDate = useMemo(
    () => getEthiopianDate(new Date()),
    [],
  );

  const historyDays = useMemo(() => {
    const year = Number(historyYear);
    const month = Number(historyMonth);

    if (!year || !month) {
      return [];
    }

    if (
      year > currentEthiopianDate.year ||
      (year === currentEthiopianDate.year &&
        month >
          currentEthiopianDate.month)
    ) {
      return [];
    }

    const count =
      getEthiopianDaysInMonth(
        year,
        month,
      );

    const allowedCount =
      year ===
        currentEthiopianDate.year &&
      month ===
        currentEthiopianDate.month
        ? currentEthiopianDate.day
        : count;

    return Array.from(
      { length: allowedCount },
      (_, index) => index + 1,
    );
  }, [
    historyYear,
    historyMonth,
    currentEthiopianDate,
  ]);

  const historyHasChanges = useMemo(
    () =>
      historyRecords.some(
        (record) =>
          (historyEdits[record.id] ??
            record.status) !==
          record.status,
      ),
    [historyRecords, historyEdits],
  );

  const showSuccess = useCallback(
    (message: string) => {
      setSuccess(message);

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    },
    [],
  );

  const showError = useCallback(
    (message: string) => {
      setError(message);

      window.setTimeout(() => {
        setError("");
      }, 5000);
    },
    [],
  );

  const loadGroups = useCallback(
    async () => {
      try {
        setLoadingGroups(true);
        setError("");

        const {
          data,
          error: groupsError,
        } = await supabase
          .from("mezmur_groups")
          .select(
            "id, code, name, grade_number, sort_order",
          )
          .order("sort_order", {
            ascending: true,
          });

        if (groupsError) {
          throw groupsError;
        }

        const allGroups =
          (data ?? []) as MezmurGroup[];

        const found: {
          type:
            | "grade5"
            | "grade6"
            | "grade7"
            | "youth";
          group: MezmurGroup;
        }[] = [];

        for (const group of allGroups) {
          const type =
            getAllowedGroupType(group);

          if (
            type &&
            !found.some(
              (item) =>
                item.type === type,
            )
          ) {
            found.push({
              type,
              group,
            });
          }
        }

        const order = [
          "grade5",
          "grade6",
          "grade7",
          "youth",
        ];

        found.sort(
          (a, b) =>
            order.indexOf(a.type) -
            order.indexOf(b.type),
        );

        const allowedGroups =
          found.map(
            (item) => item.group,
          );

        setGroups(allowedGroups);

        if (
          selectedGroupId &&
          !allowedGroups.some(
            (group) =>
              group.id ===
              selectedGroupId,
          )
        ) {
          setSelectedGroupId(null);
        }

        if (
          !selectedGroupId &&
          allowedGroups.length > 0
        ) {
          setSelectedGroupId(
            allowedGroups[0].id,
          );
        }
      } catch (err) {
        console.error(err);

        showError(
          "የመዝሙር ክፍሎችን ማምጣት አልተቻለም።",
        );
      } finally {
        setLoadingGroups(false);
      }
    },
    [
      selectedGroupId,
      showError,
    ],
  );

  const loadGroupDailyStats =
    useCallback(
      async (
        groupIds: string[],
        attendanceDate: string,
      ) => {
        if (groupIds.length === 0) {
          setGroupDailyStats({});
          return;
        }

        try {
          const {
            data: memberRows,
            error: memberError,
          } = await supabase
            .from("mezmur_members")
            .select("id, group_id")
            .in("group_id", groupIds)
            .eq("active", true);

          if (memberError) {
            throw memberError;
          }

          const stats: Record<
            string,
            GroupDailyStats
          > = {};

          groupIds.forEach(
            (groupId) => {
              stats[groupId] = {
                members: 0,
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
              };
            },
          );

          const memberGroupById: Record<
            string,
            string
          > = {};

          (
            memberRows ?? []
          ).forEach(
            (row: {
              id: string;
              group_id: string;
            }) => {
              if (
                !stats[row.group_id]
              ) {
                return;
              }

              stats[
                row.group_id
              ].members += 1;

              memberGroupById[
                row.id
              ] = row.group_id;
            },
          );

          const memberIds =
            Object.keys(
              memberGroupById,
            );

          if (memberIds.length > 0) {
            const {
              data: attendanceRows,
              error:
                attendanceError,
            } = await supabase
              .from(
                "mezmur_attendance",
              )
              .select(
                "mezmur_member_id, status",
              )
              .in(
                "mezmur_member_id",
                memberIds,
              )
              .eq(
                "attendance_date",
                attendanceDate,
              );

            if (attendanceError) {
              throw attendanceError;
            }

            (
              attendanceRows ?? []
            ).forEach(
              (row: {
                mezmur_member_id: string;
                status: AttendanceStatus;
              }) => {
                const groupId =
                  memberGroupById[
                    row.mezmur_member_id
                  ];

                if (
                  !groupId ||
                  !stats[groupId]
                ) {
                  return;
                }

                if (
                  row.status ===
                  "present"
                ) {
                  stats[
                    groupId
                  ].present += 1;
                }

                if (
                  row.status ===
                  "absent"
                ) {
                  stats[
                    groupId
                  ].absent += 1;
                }

                if (
                  row.status ===
                  "late"
                ) {
                  stats[
                    groupId
                  ].late += 1;
                }

                if (
                  row.status ===
                  "excused"
                ) {
                  stats[
                    groupId
                  ].excused += 1;
                }
              },
            );
          }

          setGroupDailyStats(
            stats,
          );
        } catch (err) {
          console.error(err);

          showError(
            "የክፍሎቹን የዕለቱን ስታቲስቲክስ ማምጣት አልተቻለም።",
          );
        }
      },
      [showError],
    );

  const loadGroupMembers =
    useCallback(
      async (groupId: string) => {
        try {
          setLoadingMembers(true);

          const {
            data,
            error: membersError,
          } = await supabase
            .from("mezmur_members")
            .select(
              `
                id,
                member_id,
                group_id,
                active,
                member:members (
                  id,
                  first_name,
                  father_name,
                  grandfather_name,
                  gender,
                  registration_number,
                  phone
                )
              `,
            )
            .eq("group_id", groupId)
            .eq("active", true)
            .order("created_at", {
              ascending: true,
            });

          if (membersError) {
            throw membersError;
          }

          setMembers(
            (data ?? []) as unknown as Member[],
          );
        } catch (err) {
          console.error(err);

          showError(
            "የክፍሉን አባላት ማምጣት አልተቻለም።",
          );
        } finally {
          setLoadingMembers(false);
        }
      },
      [showError],
    );

  const loadAttendanceForDate =
    useCallback(
      async (
        groupId: string,
        date: string,
      ) => {
        try {
          setLoadingAttendance(true);

          const {
            data: groupMembers,
            error: membersError,
          } = await supabase
            .from("mezmur_members")
            .select("id")
            .eq("group_id", groupId)
            .eq("active", true);

          if (membersError) {
            throw membersError;
          }

          const ids = (
            groupMembers ?? []
          ).map(
            (item: {
              id: string;
            }) => item.id,
          );

          if (ids.length === 0) {
            setAttendance({});
            setSavedAttendance({});
            return;
          }

          const {
            data,
            error: attendanceError,
          } = await supabase
            .from("mezmur_attendance")
            .select(
              "mezmur_member_id, attendance_date, status",
            )
            .in(
              "mezmur_member_id",
              ids,
            )
            .eq(
              "attendance_date",
              date,
            );

          if (attendanceError) {
            throw attendanceError;
          }

          const map: Record<
            string,
            AttendanceStatus
          > = {};

          (
            data ?? []
          ).forEach(
            (
              record: AttendanceRecord,
            ) => {
              map[
                record.mezmur_member_id
              ] = record.status;
            },
          );

          setAttendance(map);
          setSavedAttendance(map);
        } catch (err) {
          console.error(err);

          showError(
            "የዕለቱን የመገኘት መረጃ ማምጣት አልተቻለም።",
          );
        } finally {
          setLoadingAttendance(false);
        }
      },
      [showError],
    );

  const loadExistingMembers =
    useCallback(async () => {
      try {
        setLoadingExistingMembers(
          true,
        );

        const {
          data,
          error: membersError,
        } = await supabase
          .from("members")
          .select(
            "id, first_name, father_name, grandfather_name, gender, registration_number, phone, member_photo_path",
          )
          .order("first_name", {
            ascending: true,
          })
          .limit(1000);

        if (membersError) {
          throw membersError;
        }

        setExistingMembers(
          (data ?? []) as ExistingMember[],
        );
      } catch (err) {
        console.error(err);

        showError(
          "የዋና አባላትን ዝርዝር ማምጣት አልተቻለም።",
        );
      } finally {
        setLoadingExistingMembers(
          false,
        );
      }
    }, [showError]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (groups.length === 0) {
      setGroupDailyStats({});
      return;
    }

    void loadGroupDailyStats(
      groups.map(
        (group) => group.id,
      ),
      selectedDate,
    );
  }, [
    groups,
    selectedDate,
    loadGroupDailyStats,
  ]);

  useEffect(() => {
    if (!selectedGroupId) {
      setMembers([]);
      setAttendance({});
      setSavedAttendance({});
      return;
    }

    loadGroupMembers(
      selectedGroupId,
    );
  }, [
    selectedGroupId,
    loadGroupMembers,
  ]);

  useEffect(() => {
    if (!selectedGroupId) return;

    loadAttendanceForDate(
      selectedGroupId,
      selectedDate,
    );
  }, [
    selectedGroupId,
    selectedDate,
    loadAttendanceForDate,
  ]);

  const resetAddMemberState = () => {
    setAddMemberSearch("");
    setExistingMembers([]);
    setAddMemberError("");
  };

  const resetHistoryState = () => {
    setHistorySearch("");
    setHistoryRecords([]);
    setHistoryEdits({});

    const freshToday = getEthiopianDate(new Date());

    setHistoryYear(String(freshToday.year));
    setHistoryMonth(String(freshToday.month));
    setHistoryDay(String(freshToday.day));
  };

  const openAddMemberModal =
    async () => {
      resetAddMemberState();
      resetHistoryState();
      setError("");
      setSuccess("");
      setShowAddMember(true);
      await loadExistingMembers();
    };

  const closeAddMemberModal = () => {
    setShowAddMember(false);
    resetAddMemberState();
  };

  const openHistoryModal = () => {
    resetHistoryState();
    setShowHistory(true);
  };

  const closeHistoryModal = () => {
    setShowHistory(false);
    resetHistoryState();
  };

  const addExistingMember =
    async (
      member: ExistingMember,
    ) => {
      if (!selectedGroupId) return;

      try {
        setError("");
        setSuccess("");
        setAddMemberError("");

        // A student may have only one active Mezmur assignment.
        // Check every active assignment, not only the currently selected grade.
        const {
          data: existingAssignments,
          error: existingError,
        } = await supabase
          .from("mezmur_members")
          .select("id, active, group_id")
          .eq("member_id", member.id)
          .eq("active", true);

        if (existingError) {
          throw existingError;
        }

        const activeAssignment =
          existingAssignments?.[0] ?? null;

        if (activeAssignment) {
          const {
            data: assignedGroup,
            error: assignedGroupError,
          } = await supabase
            .from("mezmur_groups")
            .select("id, code, name, grade_number, sort_order")
            .eq("id", activeAssignment.group_id)
            .maybeSingle();

          if (assignedGroupError) {
            throw assignedGroupError;
          }

          const assignedGroupName =
            assignedGroup
              ? getGroupDisplayName(
                  assignedGroup as MezmurGroup,
                )
              : "ሌላ መዝሙር ክፍል";

          const message =
            activeAssignment.group_id ===
            selectedGroupId
              ? `ይህ ተማሪ በ${assignedGroupName} አስቀድሞ ተመድቧል።`
              : `ይህ ተማሪ በ${assignedGroupName} አስቀድሞ ተመድቧል። አንድ ተማሪ በአንድ መዝሙር ክፍል ብቻ ሊመደብ ይችላል።`;

          // Keep the Add Member modal open so the message is impossible to miss.
          setAddMemberError(message);
          return;
        }

        const {
          data: sameGroupAssignment,
          error: sameGroupError,
        } = await supabase
          .from("mezmur_members")
          .select("id, active, group_id")
          .eq("member_id", member.id)
          .eq("group_id", selectedGroupId)
          .maybeSingle();

        if (sameGroupError) {
          throw sameGroupError;
        }

        if (sameGroupAssignment && !sameGroupAssignment.active) {
          const {
            error: reactivateError,
          } = await supabase
            .from("mezmur_members")
            .update({ active: true })
            .eq("id", sameGroupAssignment.id);

          if (reactivateError) {
            throw reactivateError;
          }
        } else if (!sameGroupAssignment) {
          const {
            error: insertError,
          } = await supabase
            .from("mezmur_members")
            .insert({
              member_id: member.id,
              group_id: selectedGroupId,
              active: true,
            });

          if (insertError) {
            // Handle a database unique constraint as an assignment conflict too.
            if (insertError.code === "23505") {
              setAddMemberError(
                "ይህ ተማሪ አስቀድሞ በሌላ መዝሙር ክፍል ተመድቧል።",
              );
              return;
            }

            throw insertError;
          }
        }

        await loadGroupMembers(selectedGroupId);

        await loadGroupDailyStats(
          groups.map((group) => group.id),
          selectedDate,
        );

        closeAddMemberModal();

        showSuccess(
          "አባሉ በመዝሙር ክፍሉ ተመድቧል።",
        );
      } catch (err) {
        console.error(err);

        setAddMemberError(
          "አባሉን ወደ መዝሙር ክፍሉ ማከል አልተቻለም።",
        );
      }
    };

  const removeMemberFromGroup =
    async (
      mezmurMemberId: string,
    ) => {
      if (!selectedGroupId) return;

      const member = members.find(
        (item) =>
          item.id ===
          mezmurMemberId,
      );

      if (!member?.member) return;

      const groupName =
        selectedGroup
          ? getGroupDisplayName(
              selectedGroup,
            )
          : "ይህ ክፍል";

      const confirmed =
        window.confirm(
          `${member.member.first_name} ${member.member.father_name} ከ${groupName} ለማስወገድ እርግጠኛ ነዎት?`,
        );

      if (!confirmed) return;

      try {
        setError("");
        setSuccess("");

        const {
          error: removeError,
        } = await supabase
          .from("mezmur_members")
          .update({
            active: false,
          })
          .eq(
            "id",
            mezmurMemberId,
          )
          .eq(
            "group_id",
            selectedGroupId,
          );

        if (removeError) {
          throw removeError;
        }

        await loadGroupMembers(
          selectedGroupId,
        );

        await loadGroupDailyStats(
          groups.map(
            (group) => group.id,
          ),
          selectedDate,
        );

        showSuccess(
          "አባሉ ከመዝሙር ክፍሉ ተወግዷል።",
        );
      } catch (err) {
        console.error(err);

        showError(
          "አባሉን ከመዝሙር ክፍሉ ማስወገድ አልተቻለም።",
        );
      }
    };

  const setMemberAttendance = (
    memberId: string,
    status: AttendanceStatus,
  ) => {
    setAttendance(
      (previous) => ({
        ...previous,
        [memberId]: status,
      }),
    );
  };

  const saveAttendance =
    async () => {
      if (!selectedGroupId) return;

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const rows =
          members.map(
            (item) => ({
              mezmur_member_id:
                item.id,
              attendance_date:
                selectedDate,
              status:
                attendance[
                  item.id
                ] ?? "absent",
            }),
          );

        if (rows.length === 0) {
          showError(
            "ለመመዝገብ አባላት የሉም።",
          );
          return;
        }

        const {
          error: saveError,
        } = await supabase
          .from("mezmur_attendance")
          .upsert(rows, {
            onConflict:
              "mezmur_member_id,attendance_date",
          });

        if (saveError) {
          throw saveError;
        }

        setSavedAttendance({
          ...attendance,
        });

        await loadGroupDailyStats(
          groups.map(
            (group) => group.id,
          ),
          selectedDate,
        );

        showSuccess(
          `${formatEthiopianDate(
            selectedDate,
          )} የመገኘት መረጃው በትክክል ተመዝግቧል።`,
        );
      } catch (err) {
        console.error(err);

        showError(
          "የመገኘት መረጃውን መመዝገብ አልተቻለም።",
        );
      } finally {
        setSaving(false);
      }
    };

  const goToPreviousDay =
    () => {
      const previous =
        changeGregorianDay(
          selectedGregorianDate,
          -1,
        );

      const ethiopian =
        getEthiopianDate(
          previous,
        );

      setSelectedGregorianDate(
        previous,
      );

      setSelectedDate(
        ethiopian.value,
      );
    };

  const goToToday = () => {
    const now = new Date();

    const ethiopian =
      getEthiopianDate(now);

    setSelectedGregorianDate(now);
    setSelectedDate(
      ethiopian.value,
    );
  };

  const searchAttendanceHistory =
    async (
      overrideDate?: {
        year: number;
        month: number;
        day: number;
      },
    ) => {
      if (!selectedGroupId) return;

      try {
        setSearchingHistory(
          true,
        );

        setError("");

        const year =
          overrideDate?.year ??
          Number(historyYear);

        const month =
          overrideDate?.month ??
          Number(historyMonth);

        const day =
          overrideDate?.day ??
          Number(historyDay);

        if (
          !year ||
          !month ||
          !day
        ) {
          showError(
            "የኢትዮጵያ ዓመት፣ ወር እና ቀን በትክክል ይምረጡ።",
          );
          return;
        }

        const maxDay =
          getEthiopianDaysInMonth(
            year,
            month,
          );

        if (day > maxDay) {
          showError(
            "የተመረጠው ቀን በዚህ ወር ውስጥ የለም።",
          );
          return;
        }

        if (
          isFutureEthiopianDate(
            year,
            month,
            day,
          )
        ) {
          showError(
            "የወደፊት ቀን መፈለግ አይቻልም። ዛሬ ወይም ያለፈ ቀን ይምረጡ።",
          );
          return;
        }

        const date =
          `${year}-${String(
            month,
          ).padStart(
            2,
            "0",
          )}-${String(day).padStart(
            2,
            "0",
          )}`;

        const {
          data: groupMembers,
          error:
            groupMembersError,
        } = await supabase
          .from("mezmur_members")
          .select(
            `
              id,
              member_id,
              group_id,
              active,
              member:members (
                id,
                first_name,
                father_name,
                grandfather_name,
                registration_number,
                gender,
                phone
              )
            `,
          )
          .eq(
            "group_id",
            selectedGroupId,
          );

        if (groupMembersError) {
          throw groupMembersError;
        }

        const assignments =
          (groupMembers ??
            []) as unknown as Member[];

        if (
          assignments.length ===
          0
        ) {
          setHistoryRecords([]);
          setHistoryEdits({});
          return;
        }

        const assignmentIds =
          assignments.map(
            (item) => item.id,
          );

        const {
          data: attendanceRows,
          error:
            attendanceError,
        } = await supabase
          .from("mezmur_attendance")
          .select(
            "id, mezmur_member_id, attendance_date, status",
          )
          .in(
            "mezmur_member_id",
            assignmentIds,
          )
          .eq(
            "attendance_date",
            date,
          )
          .order("id", {
            ascending: true,
          });

        if (attendanceError) {
          throw attendanceError;
        }

        const attendanceByMember:
          Record<
            string,
            {
              id: string;
              attendance_date: string;
              status: AttendanceStatus;
            }
          > = {};

        (
          attendanceRows ?? []
        ).forEach(
          (record: {
            id: string;
            mezmur_member_id: string;
            attendance_date: string;
            status: AttendanceStatus;
          }) => {
            attendanceByMember[
              record.mezmur_member_id
            ] = {
              id: record.id,
              attendance_date:
                record.attendance_date,
              status: record.status,
            };
          },
        );

        /*
         * IMPORTANT:
         * We intentionally use ALL assignments here,
         * including inactive ones.
         *
         * This preserves historical attendance for
         * members who were later removed from the group.
         *
         * If no attendance row exists for that member/date,
         * the historical status is treated as absent.
         */
        const rows: HistoryRow[] =
          [];

        assignments.forEach(
          (assignment) => {
            if (!assignment.member) {
              return;
            }

            const attendanceRecord =
              attendanceByMember[
                assignment.id
              ];

            rows.push({
              id:
                attendanceRecord?.id ??
                `history-${assignment.id}-${date}`,
              attendance_date:
                date,
              status:
                attendanceRecord?.status ??
                "absent",
              memberId:
                assignment.id,
              memberName:
                `${assignment.member.first_name} ${assignment.member.father_name} ${assignment.member.grandfather_name}`,
              registrationNumber:
                assignment.member
                  .registration_number,
            });
          },
        );

        rows.sort((a, b) =>
          a.memberName.localeCompare(
            b.memberName,
          ),
        );

        const edits: Record<
          string,
          AttendanceStatus
        > = {};

        rows.forEach(
          (record) => {
            edits[record.id] =
              record.status;
          },
        );

        setHistoryRecords(rows);
        setHistoryEdits(edits);
      } catch (err) {
        console.error(err);

        showError(
          "የታሪክ መረጃውን ማምጣት አልተቻለም።",
        );
      } finally {
        setSearchingHistory(
          false,
        );
      }
    };

  const openPermissionPasswordModal = (
    recordId: string,
    nextStatus: AttendanceStatus,
    targetType: "daily" | "history",
  ) => {
    setPermissionRecordId(recordId);
    setPermissionTargetType(targetType);
    setPermissionPendingStatus(nextStatus);
    setPermissionPassword("");
    setPermissionError("");
  };

  const closePermissionPasswordModal = () => {
    if (verifyingPermission) return;
    setPermissionRecordId(null);
    setPermissionTargetType(null);
    setPermissionPendingStatus(null);
    setPermissionPassword("");
    setPermissionError("");
  };

  const openClearDatePasswordModal = () => {
    setClearDatePassword("");
    setClearDateError("");
    setShowClearDatePassword(true);
  };

  const closeClearDatePasswordModal = () => {
    if (clearingDateHistory) return;
    setShowClearDatePassword(false);
    setClearDatePassword("");
    setClearDateError("");
  };

  const clearCurrentDateHistory = async () => {
    const historyDate = `${historyYear}-${String(Number(historyMonth)).padStart(2, "0")}-${String(Number(historyDay)).padStart(2, "0")}`;

    if (!clearDatePassword.trim()) {
      setClearDateError("የአስተዳዳሪ ይለፍ ቃል ያስገቡ።");
      return;
    }

    try {
      setClearingDateHistory(true);
      setClearDateError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user?.email) {
        setClearDateError("የአስተዳዳሪ የመግቢያ መረጃ አልተገኘም። እባክዎ እንደገና ይግቡ።");
        return;
      }

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: clearDatePassword,
        });

      if (authError) {
        setClearDateError("የአስተዳዳሪ ይለፍ ቃሉ ትክክል አይደለም። ምንም ለውጥ አልተደረገም።");
        return;
      }

      const { error: deleteError } = await supabase
        .from("mezmur_attendance")
        .delete()
        .eq("attendance_date", historyDate);

      if (deleteError) {
        throw deleteError;
      }

      setHistoryRecords([]);
      setHistoryEdits({});

      if (selectedGroupId && selectedDate === historyDate) {
        await loadAttendanceForDate(
          selectedGroupId,
          selectedDate,
        );

        await loadGroupDailyStats(
          groups.map((group) => group.id),
          selectedDate,
        );
      }

      setShowClearDatePassword(false);
      setClearDatePassword("");
      setClearDateError("");

      showSuccess(
        `${formatEthiopianDate(historyDate)} የመገኘት ታሪክ በቋሚነት ተሰርዟል።`,
      );
    } catch (err) {
      console.error(err);
      setClearDateError("የዚህን ቀን የመገኘት ታሪክ መሰረዝ አልተቻለም።");
    } finally {
      setClearingDateHistory(false);
    }
  };

  const confirmAbsentToPermission = async () => {
    if (
      !permissionRecordId ||
      !permissionPendingStatus ||
      !permissionTargetType
    ) {
      return;
    }

    let memberName = "ተማሪው";
    let currentStatus: AttendanceStatus;

    if (permissionTargetType === "history") {
      const record = historyRecords.find(
        (item) => item.id === permissionRecordId,
      );

      if (!record) {
        closePermissionPasswordModal();
        return;
      }

      memberName = record.memberName;
      currentStatus =
        historyEdits[record.id] ?? record.status;
    } else {
      const member = members.find(
        (item) => item.id === permissionRecordId,
      );

      if (!member) {
        closePermissionPasswordModal();
        return;
      }

      memberName = member.member
        ? `${member.member.first_name} ${member.member.father_name}`.trim()
        : "አባል";
      currentStatus =
        attendance[member.id] ?? "absent";
    }

    if (currentStatus === permissionPendingStatus) {
      closePermissionPasswordModal();
      return;
    }

    if (!permissionPassword.trim()) {
      setPermissionError("የአስተዳዳሪ ይለፍ ቃል ያስገቡ።");
      return;
    }

    try {
      setVerifyingPermission(true);
      setPermissionError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user?.email) {
        setPermissionError(
          "የአስተዳዳሪ የመግቢያ መረጃ አልተገኘም። እባክዎ እንደገና ይግቡ።",
        );
        return;
      }

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: permissionPassword,
        });

      if (authError) {
        setPermissionError(
          "የአስተዳዳሪ ይለፍ ቃሉ ትክክል አይደለም። ምንም ለውጥ አልተደረገም።",
        );
        return;
      }

      if (permissionTargetType === "history") {
        setHistoryStatus(
          permissionRecordId,
          permissionPendingStatus,
        );
      } else {
        setMemberAttendance(
          permissionRecordId,
          permissionPendingStatus,
        );
      }

      const statusLabel =
        STATUS_LABELS[permissionPendingStatus];

      setPermissionRecordId(null);
      setPermissionTargetType(null);
      setPermissionPendingStatus(null);
      setPermissionPassword("");
      setPermissionError("");

      showSuccess(
        `${memberName} የመገኘት ሁኔታ ወደ ${statusLabel} ተቀይሯል። ለውጡን ለማስቀመጥ የማስቀመጫ ቁልፉን ይጫኑ።`,
      );
    } catch (err) {
      console.error(err);
      setPermissionError(
        "የአስተዳዳሪ ይለፍ ቃል ማረጋገጥ አልተቻለም።",
      );
    } finally {
      setVerifyingPermission(false);
    }
  };

  const setHistoryStatus = (
    recordId: string,
    status: AttendanceStatus,
  ) => {
    setHistoryEdits(
      (previous) => ({
        ...previous,
        [recordId]: status,
      }),
    );
  };

  const saveHistoryChanges =
    async () => {
      if (
        !selectedGroupId ||
        historyRecords.length === 0
      ) {
        return;
      }

      try {
        setSavingHistory(true);
        setError("");
        setSuccess("");

        const rows =
          historyRecords.map(
            (record) => ({
              mezmur_member_id:
                record.memberId,
              attendance_date:
                record.attendance_date,
              status:
                historyEdits[
                  record.id
                ] ??
                record.status,
            }),
          );

        const {
          error: saveError,
        } = await supabase
          .from("mezmur_attendance")
          .upsert(rows, {
            onConflict:
              "mezmur_member_id,attendance_date",
          });

        if (saveError) {
          throw saveError;
        }

        await searchAttendanceHistory();

        if (
          selectedDate ===
            historyRecords[0]
              ?.attendance_date &&
          selectedGroupId
        ) {
          await loadAttendanceForDate(
            selectedGroupId,
            selectedDate,
          );

          await loadGroupDailyStats(
            groups.map(
              (group) =>
                group.id,
            ),
            selectedDate,
          );
        }

        showSuccess(
          `${formatEthiopianDate(
            historyRecords[0]
              ?.attendance_date ??
              selectedDate,
          )} የታሪክ መገኘት መረጃ ተሻሽሏል።`,
        );
      } catch (err) {
        console.error(err);

        showError(
          "የታሪክ መገኘት መረጃውን ማሻሻል አልተቻለም።",
        );
      } finally {
        setSavingHistory(false);
      }
    };

  const refreshAll = async () => {
    try {
      setRefreshing(true);
      setError("");

      await loadGroups();

      if (selectedGroupId) {
        await loadGroupMembers(
          selectedGroupId,
        );

        await loadAttendanceForDate(
          selectedGroupId,
          selectedDate,
        );
      }

      await loadGroupDailyStats(
        groups.map(
          (group) => group.id,
        ),
        selectedDate,
      );

      showSuccess(
        "መረጃው ታድሷል።",
      );
    } catch (err) {
      console.error(err);

      showError(
        "መረጃውን ማደስ አልተቻለም።",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const search =
      memberSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return members;
    }

    return members.filter(
      (item) => {
        if (!item.member) {
          return false;
        }

        const text = [
          item.member.first_name,
          item.member.father_name,
          item.member.grandfather_name,
          item.member
            .registration_number,
          item.member.phone ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(search);
      },
    );
  }, [members, memberSearch]);

  const filteredExistingMembers =
    useMemo(() => {
      const search =
        addMemberSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return existingMembers;
      }

      return existingMembers.filter(
        (member) => {
          const text = [
            member.first_name,
            member.father_name,
            member.grandfather_name,
            member.registration_number,
            member.phone ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(search);
        },
      );
    }, [
      existingMembers,
      addMemberSearch,
    ]);

  const filteredHistory =
    useMemo(
      () => {
        const search =
          historySearch
            .trim()
            .toLowerCase();

        if (!search) {
          return historyRecords;
        }

        return historyRecords.filter(
          (item) =>
            [
              item.memberName,
              item.registrationNumber,
              STATUS_LABELS[
                item.status
              ],
            ]
              .join(" ")
              .toLowerCase()
              .includes(search),
        );
      },
      [
        historyRecords,
        historySearch,
      ],
    );

  const selectedGroupDailyStats =
    useMemo(() => {
      const serverStats =
        selectedGroupId
          ? groupDailyStats[
              selectedGroupId
            ]
          : undefined;

      const values =
        members.map(
          (item) =>
            attendance[
              item.id
            ] ?? "absent",
        );

      return {
        members:
          serverStats?.members ??
          members.length,
        present:
          values.filter(
            (value) =>
              value === "present",
          ).length,
        absent:
          values.filter(
            (value) =>
              value === "absent",
          ).length,
        late:
          values.filter(
            (value) =>
              value === "late",
          ).length,
        excused:
          values.filter(
            (value) =>
              value === "excused",
          ).length,
      };
    }, [
      selectedGroupId,
      groupDailyStats,
      members,
      attendance,
    ]);

  const hasChanges = useMemo(() => {
    if (members.length === 0) {
      return false;
    }

    return members.some(
      (item) =>
        (attendance[
          item.id
        ] ?? "absent") !==
        (savedAttendance[
          item.id
        ] ?? "absent"),
    );
  }, [
    members,
    attendance,
    savedAttendance,
  ]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="absolute bottom-[-160px] left-1/3 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img
              src="/logo.png"
              alt="ጽርሐ ጽዮን ሰንበት ትምህርት ቤት"
              className="h-full w-full object-contain p-1"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="mt-0.5 text-sm font-black leading-5 text-slate-900 sm:text-lg lg:text-xl">
              የጽርሐ ጽዮን ሰንበት ትምህርት ቤትየመዝሙር ክፍል አቴንዳን መቆጣጠሪያ
            </h1>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-2 sm:px-4"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            <span className="hidden text-sm font-bold sm:inline">
              አድስ
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <section className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                የመዝሙር ክፍሎች
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                የመዝሙር ክፍል ይምረጡ
              </h2>
            </div>

            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-600">
              {groups.length} ክፍሎች
            </span>
          </div>

          {loadingGroups ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-3xl bg-slate-200"
                  />
                ),
              )}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-amber-500" />

              <p className="font-black text-amber-800">
                የመዝሙር ክፍሎች አልተገኙም።
              </p>

              <p className="mt-1 text-sm font-medium text-amber-700">
                ፭ኛ፣ ፮ኛ፣ ፯ኛ ክፍል እና ወጣት ያስፈልጋሉ።
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {groups.map(
                (group) => {
                  const active =
                    selectedGroupId ===
                    group.id;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        setSelectedGroupId(
                          group.id,
                        )
                      }
                      className={`group relative overflow-hidden rounded-3xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                        active
                          ? "border-indigo-500 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-indigo-200"
                          : "border-slate-200 bg-white text-slate-900 hover:border-indigo-200"
                      }`}
                    >
                      <div
                        className={`absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full ${
                          active
                            ? "bg-white/10"
                            : "bg-indigo-50"
                        }`}
                      />

                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                              active
                                ? "bg-white/15"
                                : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            <Users className="h-5 w-5" />
                          </div>

                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                              active
                                ? "bg-white/10"
                                : "bg-slate-50"
                            }`}
                          >
                            <span
                              className={`text-lg ${
                                active
                                  ? "text-white"
                                  : "text-slate-400"
                              }`}
                            >
                              ›
                            </span>
                          </div>
                        </div>

                        <p
                          className={`mt-4 text-base font-black sm:text-lg ${
                            active
                              ? "text-white"
                              : "text-slate-900"
                          }`}
                        >
                          {getGroupDisplayName(
                            group,
                          )}
                        </p>

                        <p
                          className={`mt-1 text-xs font-bold ${
                            active
                              ? "text-indigo-100"
                              : "text-slate-400"
                          }`}
                        >
                          የመዝሙር ክፍል
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>

        {selectedGroup && (
          <>
            <section className="mb-6">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-500">
                    የዕለቱ ስታቲስቲክስ
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {getGroupDisplayName(
                      selectedGroup,
                    )}{" "}
                    የመገኘት ስታቲስቲክስ
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />

                  <span className="text-xs font-black text-indigo-700">
                    {formatEthiopianDate(
                      selectedDate,
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>

                    <span className="text-2xl font-black text-slate-900">
                      {
                        selectedGroupDailyStats.members
                      }
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-slate-400">
                    አባላት
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-700">
                    ጠቅላላ አባላት
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                      <Check className="h-5 w-5" />
                    </div>

                    <span className="text-2xl font-black text-emerald-700">
                      {
                        selectedGroupDailyStats.present
                      }
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-emerald-600">
                    ተገኝቷል/ታለች
                  </p>

                  <p className="mt-1 text-sm font-black text-emerald-800">
                    የተገኙ
                  </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                      <X className="h-5 w-5" />
                    </div>

                    <span className="text-2xl font-black text-rose-700">
                      {
                        selectedGroupDailyStats.absent
                      }
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-rose-600">
                    አልተገኘም/አልተገኘችም
                  </p>

                  <p className="mt-1 text-sm font-black text-rose-800">
                    የቀሩ
                  </p>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                      <Clock3 className="h-5 w-5" />
                    </div>

                    <span className="text-2xl font-black text-amber-700">
                      {
                        selectedGroupDailyStats.late
                      }
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-amber-600">
                    ዘግይቷል/ዘግይታለች
                  </p>

                  <p className="mt-1 text-sm font-black text-amber-800">
                    የዘገዩ
                  </p>
                </div>

                <div className="col-span-2 rounded-3xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm sm:col-span-4 xl:col-span-1 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <span className="text-2xl font-black text-violet-700">
                      {
                        selectedGroupDailyStats.excused
                      }
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black text-violet-600">
                    ፈቃድ
                  </p>

                  <p className="mt-1 text-sm font-black text-violet-800">
                    ፈቃድ ያላቸው
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-5 text-white shadow-xl sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-indigo-100">
                      {isToday
                        ? "የዛሬ መገኘት"
                        : "የተመረጠ ቀን"}
                    </span>

                    {hasChanges && (
                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black text-amber-200">
                        ለመመዝገብ ዝግጁ
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black sm:text-4xl">
                    {getGroupDisplayName(
                      selectedGroup,
                    )}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-indigo-100">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatEthiopianDate(
                        selectedDate,
                      )}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-indigo-300" />

                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {members.length} አባላት
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Date Navigation - previous + today only */}
            <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {formatEthiopianDate(
                      selectedDate,
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={
                      goToPreviousDay
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    <span>
                      ቀዳሚ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={
                      goToToday
                    }
                    className={`h-11 rounded-2xl px-4 text-sm font-black transition ${
                      isToday
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    የዛሬ
                  </button>
                </div>
              </div>
            </section>

            <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={
                      memberSearch
                    }
                    onChange={(
                      event,
                    ) =>
                      setMemberSearch(
                        event.target.value,
                      )
                    }
                    placeholder="አባል ይፈልጉ..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={
                      openAddMemberModal
                    }
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
                  >
                    <UserPlus className="h-4 w-4" />
                    አባል ጨምር
                  </button>

                  <button
                    type="button"
                    onClick={
                      openHistoryModal
                    }
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 active:scale-[0.98]"
                  >
                    <History className="h-4 w-4" />
                    ታሪክ
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-indigo-500">
                      የመገኘት ዝርዝር
                    </p>

                    <h3 className="mt-1 text-xl font-black">
                      የአባላት ዝርዝር
                    </h3>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    {
                      filteredMembers.length
                    }{" "}
                    /{" "}
                    {
                      members.length
                    }
                  </span>
                </div>
              </div>

              {loadingMembers ||
              loadingAttendance ? (
                <div className="space-y-3 p-5 sm:p-6">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-32 animate-pulse rounded-3xl bg-slate-100"
                      />
                    ),
                  )}
                </div>
              ) : filteredMembers.length ===
                0 ? (
                <div className="p-10 text-center sm:p-16">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500">
                    <Users className="h-7 w-7" />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-900">
                    {members.length ===
                    0
                      ? "አባላት አልተመደቡም"
                      : "የሚፈለገው አባል አልተገኘም"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                    {members.length ===
                    0
                      ? "ከዋናው የአባላት ዝርዝር አባላትን ወደዚህ የመዝሙር ክፍል ያክሉ።"
                      : "ሌላ የፍለጋ ቃል ይሞክሩ።"}
                  </p>

                  {members.length ===
                    0 && (
                    <button
                      type="button"
                      onClick={
                        openAddMemberModal
                      }
                      className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-200"
                    >
                      <UserPlus className="h-4 w-4" />
                      አባል ጨምር
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMembers.map(
                    (
                      item,
                      index,
                    ) => {
                      if (
                        !item.member
                      ) {
                        return null;
                      }

                      const currentStatus =
                        attendance[
                          item.id
                        ] ??
                        "absent";

                      return (
                        <div
                          key={
                            item.id
                          }
                          className="p-4 transition hover:bg-slate-50/70 sm:p-5"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-black text-indigo-700">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0">
                                <h4 className="truncate text-sm font-black text-slate-900 sm:text-base">
                                  {
                                    item
                                      .member
                                      .first_name
                                  }{" "}
                                  {
                                    item
                                      .member
                                      .father_name
                                  }{" "}
                                  {
                                    item
                                      .member
                                      .grandfather_name
                                  }
                                </h4>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                                  <span>
                                    #
                                    {
                                      item
                                        .member
                                        .registration_number
                                    }
                                  </span>

                                  {item
                                    .member
                                    .phone && (
                                    <>
                                      <span>
                                        •
                                      </span>

                                      <span>
                                        {
                                          item
                                            .member
                                            .phone
                                        }
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {(
                                  [
                                    "present",
                                    "absent",
                                    "late",
                                    "excused",
                                  ] as AttendanceStatus[]
                                ).map(
                                  (
                                    status,
                                  ) => {
                                    const active =
                                      currentStatus ===
                                      status;

                                    return (
                                      <button
                                        key={
                                          status
                                        }
                                        type="button"
                                        onClick={() => {
                                          const currentStatus =
                                            attendance[item.id] ?? "absent";

                                          if (status === currentStatus) {
                                            return;
                                          }

                                          openPermissionPasswordModal(
                                            item.id,
                                            status,
                                            "daily",
                                          );
                                        }}
                                        className={`flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border px-3 text-[11px] font-black transition active:scale-[0.97] sm:min-w-[125px] ${
                                          active
                                            ? STATUS_STYLES[
                                                status
                                              ]
                                                .active
                                            : STATUS_STYLES[
                                                status
                                              ]
                                                .inactive
                                        }`}
                                      >
                                        <span
                                          className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`}
                                        />

                                        <span className="text-center">
                                          {
                                            STATUS_LABELS[
                                              status
                                            ]
                                          }
                                        </span>
                                      </button>
                                    );
                                  },
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeMemberFromGroup(
                                    item.id,
                                  )
                                }
                                className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.97] xl:min-w-[120px]"
                              >
                                <Trash2 className="h-4 w-4" />
                                አስወግድ
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {selectedGroup &&
        members.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-3 shadow-[0_-10px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-4">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-1 sm:px-3">
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-black text-slate-900">
                  {getGroupDisplayName(
                    selectedGroup,
                  )}
                </p>

                <p className="text-xs font-medium text-slate-400">
                  {formatEthiopianDate(
                    selectedDate,
                  )}{" "}
                  ·{" "}
                  {members.length}{" "}
                  አባላት
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {hasChanges && (
                  <span className="hidden rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 sm:inline-flex">
                    ለመመዝገብ የተለወጠ
                  </span>
                )}

                <button
                  type="button"
                  onClick={
                    saveAttendance
                  }
                  disabled={saving}
                  className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}

                  {saving
                    ? "በመመዝገብ..."
                    : "መገኘት መዝግብ"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Add Existing Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-500">
                  የነበረ አባል
                </p>

                <h2 className="mt-1 text-xl font-black">
                  አባል ወደ{" "}
                  {selectedGroup
                    ? getGroupDisplayName(
                        selectedGroup,
                      )
                    : "መዝሙር ክፍል"}{" "}
                  ጨምር
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeAddMemberModal
                }
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-100 p-4 sm:p-5">
              {addMemberError && (
                <div className="mb-3 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                  <X className="mt-1 h-4 w-4 shrink-0" />
                  <span>{addMemberError}</span>
                  <button
                    type="button"
                    onClick={() => setAddMemberError("")}
                    className="ml-auto shrink-0"
                    aria-label="close error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={
                    addMemberSearch
                  }
                  onChange={(
                    event,
                  ) =>
                    setAddMemberSearch(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="ስም፣ የመመዝገቢያ ቁጥር ወይም ስልክ..."
                  name="mezmur-new-member-search"
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-5">
              {loadingExistingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                </div>
              ) : filteredExistingMembers.length ===
                0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm font-black text-slate-500">
                    አባል አልተገኘም።
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExistingMembers.map(
                    (
                      member,
                    ) => (
                      <button
                        key={
                          member.id
                        }
                        type="button"
                        onClick={() =>
                          addExistingMember(
                            member,
                          )
                        }
                        className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-600">
                          {member.first_name.charAt(
                            0,
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900">
                            {
                              member.first_name
                            }{" "}
                            {
                              member.father_name
                            }{" "}
                            {
                              member.grandfather_name
                            }
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-slate-400">
                            #
                            {
                              member.registration_number
                            }

                            {member.phone
                              ? ` · ${member.phone}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition group-hover:bg-indigo-600 group-hover:text-white">
                          <UserPlus className="h-4 w-4" />
                        </div>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-5xl sm:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-500">
                  የመገኘት ታሪክ
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {selectedGroup
                    ? getGroupDisplayName(
                        selectedGroup,
                      )
                    : "መዝሙር"}{" "}
                  የመገኘት ታሪክ
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetHistoryState();
                  }}
                  title="ታሪክን አድስ"
                  className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 text-sm font-black text-indigo-600 transition hover:bg-indigo-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>አድስ</span>
                </button>

                <button
                  type="button"
                  onClick={
                    closeHistoryModal
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  value={
                    historyYear
                  }
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target
                        .value;

                    setHistoryYear(
                      value,
                    );

                    const year =
                      Number(value);
                    const month =
                      Number(
                        historyMonth,
                      );

                    const current =
                      currentEthiopianDate;

                    if (
                      year >
                      current.year
                    ) {
                      setHistoryMonth(
                        String(
                          current.month,
                        ),
                      );
                      setHistoryDay(
                        String(
                          current.day,
                        ),
                      );
                      return;
                    }

                    if (
                      year ===
                        current.year &&
                      month >
                        current.month
                    ) {
                      setHistoryMonth(
                        String(
                          current.month,
                        ),
                      );
                    }

                    const maxDay =
                      getEthiopianDaysInMonth(
                        year,
                        Number(
                          historyMonth,
                        ),
                      );

                    const allowedDay =
                      year ===
                        current.year &&
                      Number(
                        historyMonth,
                      ) ===
                        current.month
                        ? Math.min(
                            maxDay,
                            current.day,
                          )
                        : maxDay;

                    if (
                      Number(
                        historyDay,
                      ) >
                      allowedDay
                    ) {
                      setHistoryDay(
                        String(
                          allowedDay,
                        ),
                      );
                    }
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {getEthiopianYears().map(
                    (year) => {
                      const disabled =
                        year >
                        currentEthiopianDate.year;

                      return (
                        <option
                          key={year}
                          value={String(
                            year,
                          )}
                          disabled={
                            disabled
                          }
                        >
                          {year}
                        </option>
                      );
                    },
                  )}
                </select>

                <select
                  value={
                    historyMonth
                  }
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target
                        .value;

                    const year =
                      Number(
                        historyYear,
                      );

                    const month =
                      Number(value);

                    if (
                      isFutureEthiopianDate(
                        year,
                        month,
                        1,
                      )
                    ) {
                      return;
                    }

                    setHistoryMonth(
                      value,
                    );

                    const maxDay =
                      getEthiopianDaysInMonth(
                        year,
                        month,
                      );

                    const allowedDay =
                      year ===
                        currentEthiopianDate.year &&
                      month ===
                        currentEthiopianDate.month
                        ? Math.min(
                            maxDay,
                            currentEthiopianDate.day,
                          )
                        : maxDay;

                    if (
                      Number(
                        historyDay,
                      ) >
                      allowedDay
                    ) {
                      setHistoryDay(
                        String(
                          allowedDay,
                        ),
                      );
                    }
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {ETHIOPIAN_MONTHS.map(
                    (
                      month,
                      index,
                    ) => {
                      const monthNumber =
                        index + 1;

                      const disabled =
                        Number(
                          historyYear,
                        ) >
                          currentEthiopianDate.year ||
                        (Number(
                          historyYear,
                        ) ===
                          currentEthiopianDate.year &&
                          monthNumber >
                            currentEthiopianDate.month);

                      return (
                        <option
                          key={month}
                          value={String(
                            monthNumber,
                          )}
                          disabled={
                            disabled
                          }
                        >
                          {monthNumber} ·{" "}
                          {month}
                        </option>
                      );
                    },
                  )}
                </select>

                <select
                  value={
                    historyDays.some(
                      (day) =>
                        String(
                          day,
                        ) ===
                        historyDay,
                    )
                      ? historyDay
                      : historyDays.length > 0
                        ? String(
                            historyDays[
                              historyDays.length -
                                1
                            ],
                          )
                        : ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setHistoryDay(
                      event.target
                        .value,
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {historyDays.map(
                    (day) => (
                      <option
                        key={day}
                        value={String(
                          day,
                        )}
                      >
                        {getEthiopianNumber(
                          day,
                        )}
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    void searchAttendanceHistory();
                  }}
                  disabled={searchingHistory}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
                >
                  {searchingHistory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}

                  ፈልግ
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-indigo-500" />

                  <span className="text-xs font-black text-indigo-700">
                    {historyDay}{" "}
                    {
                      ETHIOPIAN_MONTHS[
                        Number(
                          historyMonth,
                        ) - 1
                      ]
                    }{" "}
                    {historyYear}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    openClearDatePasswordModal
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  የዚህን ቀን ታሪክ አጽዳ
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={
                    historySearch
                  }
                  onChange={(
                    event,
                  ) =>
                    setHistorySearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="በአባል ስም ወይም በመመዝገቢያ ቁጥር ይፈልጉ..."
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-5">
              {filteredHistory.length ===
              0 ? (
                <div className="py-12 text-center">
                  <History className="mx-auto h-9 w-9 text-slate-300" />

                  <h3 className="mt-4 font-black text-slate-700">
                    የመገኘት መረጃ አልተገኘም
                  </h3>

                  <p className="mt-1 text-sm font-medium text-slate-400">
                    የኢትዮጵያ ቀን በመምረጥ ይፈልጉ።
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-indigo-900">
                        {formatEthiopianDate(
                          historyRecords[0]
                            ?.attendance_date ??
                            `${historyYear}-${String(
                              historyMonth,
                            ).padStart(
                              2,
                              "0",
                            )}-${String(
                              historyDay,
                            ).padStart(
                              2,
                              "0",
                            )}`,
                        )}
                      </p>

                      <p className="mt-1 text-xs font-bold text-indigo-600">
                        የተለወጠ የታሪክ መረጃ ካለ ከታች ይምረጡና ያስቀምጡ።
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          saveHistoryChanges
                        }
                        disabled={
                          savingHistory ||
                          !historyHasChanges
                        }
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingHistory ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}

                        {savingHistory
                          ? "በመቀመጥ ላይ..."
                          : "ለውጦችን አስቀምጥ"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredHistory.map(
                      (record) => {
                        const currentStatus =
                          historyEdits[
                            record.id
                          ] ??
                          record.status;

                        return (
                          <div
                            key={
                              record.id
                            }
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                  <Clock3 className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-black text-slate-900">
                                    {
                                      record.memberName
                                    }
                                  </p>

                                  <p className="mt-1 text-xs font-bold text-slate-400">
                                    #
                                    {
                                      record.registrationNumber
                                    }
                                  </p>

                                  <p className="mt-1 text-[11px] font-bold text-indigo-500">
                                    {formatEthiopianDate(
                                      record.attendance_date,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {(
                                  [
                                    "present",
                                    "absent",
                                    "late",
                                    "excused",
                                  ] as AttendanceStatus[]
                                ).map(
                                  (
                                    status,
                                  ) => {
                                    const active =
                                      currentStatus ===
                                      status;

                                    return (
                                      <button
                                        key={
                                          status
                                        }
                                        type="button"
                                        onClick={() => {
                                          if (status === currentStatus) {
                                            return;
                                          }

                                          openPermissionPasswordModal(
                                            record.id,
                                            status,
                                            "history",
                                          );
                                        }}
                                        className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-2 text-[10px] font-black transition active:scale-[0.97] sm:text-[11px] ${
                                          active
                                            ? STATUS_STYLES[
                                                status
                                              ]
                                                .active
                                            : STATUS_STYLES[
                                                status
                                              ]
                                                .inactive
                                        }`}
                                      >
                                        <span
                                          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLES[status].dot}`}
                                        />

                                        <span className="text-center">
                                          {
                                            STATUS_LABELS[
                                              status
                                            ]
                                          }
                                        </span>
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showClearDatePassword && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900">የዚህን ቀን ታሪክ ለማጽዳት ማረጋገጫ</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  {formatEthiopianDate(`${historyYear}-${String(Number(historyMonth)).padStart(2, "0")}-${String(Number(historyDay)).padStart(2, "0")}`)} የሁሉንም ተማሪዎች የመገኘት ታሪክ በቋሚነት ለመሰረዝ የአስተዳዳሪውን የይለፍ ቃል ያስገቡ።
                </p>
              </div>
              <button type="button" onClick={closeClearDatePasswordModal} disabled={clearingDateHistory} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            {clearDateError && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                <X className="mt-1 h-4 w-4 shrink-0" />
                <span>{clearDateError}</span>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-black text-slate-700">የአስተዳዳሪ ይለፍ ቃል</label>
              <input
                type="password"
                value={clearDatePassword}
                onChange={(event) => {
                  setClearDatePassword(event.target.value);
                  if (clearDateError) setClearDateError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void clearCurrentDateHistory();
                }}
                autoFocus
                autoComplete="current-password"
                placeholder="የይለፍ ቃል"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={closeClearDatePasswordModal} disabled={clearingDateHistory} className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">ሰርዝ</button>
              <button type="button" onClick={() => void clearCurrentDateHistory()} disabled={clearingDateHistory || !clearDatePassword.trim()} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-rose-600 text-sm font-black text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                {clearingDateHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                አጽዳ
              </button>
            </div>
          </div>
        </div>
      )}

      {permissionRecordId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900">የመገኘት ሁኔታ ለመቀየር ማረጋገጫ</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  የመገኘት ሁኔታን ለመቀየር የአስተዳዳሪውን የይለፍ ቃል ያስገቡ
                </p>
              </div>
              <button type="button" onClick={closePermissionPasswordModal} disabled={verifyingPermission} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            {permissionError && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                <X className="mt-1 h-4 w-4 shrink-0" />
                <span>{permissionError}</span>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-black text-slate-700">የአስተዳዳሪ ይለፍ ቃል</label>
              <input type="password" value={permissionPassword} onChange={(event) => { setPermissionPassword(event.target.value); if (permissionError) setPermissionError(""); }} onKeyDown={(event) => { if (event.key === "Enter") void confirmAbsentToPermission(); }} autoFocus autoComplete="current-password" placeholder="የይለፍ ቃል" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={closePermissionPasswordModal} disabled={verifyingPermission} className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">ሰርዝ</button>
              <button type="button" onClick={() => void confirmAbsentToPermission()} disabled={verifyingPermission || !permissionPassword.trim()} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                {verifyingPermission ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                አረጋግጥ
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}