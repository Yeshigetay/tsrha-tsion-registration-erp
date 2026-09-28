
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

import {
  Users,
  UserPlus,
  ArrowRight,
  UserRoundPlus,
  UserRound,
  UserRoundSearch,
  Search,
  BookOpen,
  Church,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ============================================================
  // ADMIN PROFILE
  // ============================================================

  const avatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  const adminName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "አስተዳዳሪ";

  const adminInitial =
    adminName.trim().charAt(0).toUpperCase() || "A";

  // ============================================================
  // MEMBER STATISTICS
  // ============================================================

  const [
    { count: totalMembers },
    { count: maleMembers },
    { count: femaleMembers },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("gender", "male"),

    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("gender", "female"),
  ]);

  // ============================================================
  // TODAY'S REGISTRATIONS
  // ============================================================

  const today = new Date();

  const todayString =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { count: todayMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("registration_date", todayString);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f8f5ec] text-[#172033]">

      {/* =====================================================
          PREMIUM HEADER
      ===================================================== */}

      <header className="relative w-full overflow-hidden bg-gradient-to-br from-[#082f63] via-[#0d3b78] to-[#174d91]">

        {/* Decorative circles */}

        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full border border-[#d4af37]/20" />

        <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full border border-[#d4af37]/15" />

        <div className="pointer-events-none absolute -left-28 bottom-[-130px] h-64 w-64 rounded-full border border-white/5" />

        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/[0.015] blur-2xl" />

        {/* =================================================
            HEADER CONTENT
        ================================================= */}

        <div className="relative mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:min-h-[84px] sm:gap-4 sm:px-6 sm:py-5 lg:px-8">

          {/* =================================================
              SCHOOL BRAND
          ================================================= */}

          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">

            {/* MOBILE-FRIENDLY LOGO */}

            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d4af37]/70 bg-white shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl">

              <Image
                src="/logo.png"
                alt="ጽርሐ ጽዮን ሰንበት ት/ቤት"
                width={56}
                height={56}
                sizes="56px"
                priority
                className="block h-full w-full object-contain p-1"
              />

            </div>

            {/* SCHOOL NAME */}

            <div className="min-w-0 flex-1">

              <h1 className="truncate text-[13px] font-bold tracking-wide text-white sm:text-lg">
                ጽርሐ ጽዮን
              </h1>

              <p className="truncate text-[9px] font-medium text-[#f5d77a] sm:text-xs">
                ሰንበት ት/ቤት
              </p>

            </div>

          </div>


          {/* =================================================
              ADMIN PROFILE + LOGOUT
          ================================================= */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

            {/* Desktop / tablet profile */}

            <div className="hidden items-center gap-3 md:flex">

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#d4af37]/60 bg-white shadow-md">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={adminName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-[#0d3b78]">
                    {adminInitial}
                  </span>
                )}

              </div>

              <div className="max-w-[170px]">

                <p className="truncate text-sm font-bold text-white">
                  {adminName}
                </p>

                <p className="truncate text-[11px] text-blue-100/70">
                  አስተዳዳሪ
                </p>

              </div>

            </div>


            {/* Mobile avatar */}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d4af37]/70 bg-white shadow-md sm:h-10 sm:w-10 md:hidden">

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={adminName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#0d3b78] sm:text-sm">
                  {adminInitial}
                </span>
              )}

            </div>


            {/* Logout */}

            <div className="shrink-0">
              <LogoutButton />
            </div>

          </div>

        </div>

        {/* Gold divider */}

        <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">


        {/* =================================================
            WELCOME HERO
        ================================================= */}

        <div className="relative overflow-hidden rounded-[1.25rem] border border-[#d4af37]/30 bg-white shadow-sm sm:rounded-[2rem]">

          {/* Background decoration */}

          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#0d3b78]/[0.025]" />

          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-[#d4af37]/20" />

          <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full border border-[#0d3b78]/5" />


          <div className="relative p-4 sm:p-8 lg:p-10">

            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">


              {/* =================================================
                  WELCOME CONTENT
              ================================================= */}

              <div className="min-w-0 max-w-2xl">


                {/* MOBILE LOGO */}

                <div className="mb-5 flex items-center gap-3 lg:hidden">

                  <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d4af37]/50 bg-[#f8f5ec] shadow-sm">

                    <Image
                      src="/logo.png"
                      alt="ጽርሐ ጽዮን ሰንበት ት/ቤት"
                      width={68}
                      height={68}
                      sizes="68px"
                      priority
                      className="block h-full w-full object-contain p-1"
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-[#0d3b78] sm:text-base">
                      ጽርሐ ጽዮን
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                      ሰንበት ት/ቤት
                    </p>

                  </div>

                </div>


                {/* SCHOOL LABEL */}

                <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-bold text-[#0d3b78] sm:mb-5 sm:px-3.5 sm:py-2 sm:text-xs">

                  <Church size={14} className="shrink-0" />

                  <span className="truncate">
                    ጽርሐ ጽዮን ሰንበት ት/ቤት
                  </span>

                </div>


                <h2 className="text-[1.5rem] font-bold leading-[1.3] tracking-tight text-[#172033] sm:text-3xl lg:text-4xl">

                  እንኳን ወደ አስተዳደር ዳሽቦርድ

                  <br className="hidden sm:block" />

                  <span className="bg-gradient-to-r from-[#0d3b78] to-[#174d91] bg-clip-text text-transparent">
                    በሰላም መጡ።
                  </span>

                </h2>


                <p className="mt-3 max-w-xl text-[13px] leading-6 text-gray-500 sm:mt-4 sm:text-base sm:leading-7">

                  የሰንበት ት/ቤቱን አባላት ምዝገባ፣
                  ትምህርት እና መዝሙር አስተዳደር በአንድ ቦታ
                  በቀላሉ ያስተዳድሩ።

                </p>

              </div>


              {/* =================================================
                  LARGE DESKTOP LOGO
              ================================================= */}

              <div className="hidden shrink-0 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#f8f5ec] shadow-inner lg:flex lg:h-36 lg:w-36">

                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#d4af37]/30 bg-white shadow-md">

                  <Image
                    src="/logo.png"
                    alt="ጽርሐ ጽዮን ሰንበት ት/ቤት"
                    width={112}
                    height={112}
                    sizes="112px"
                    className="block h-full w-full object-contain p-2"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* Gold accent */}

          <div className="h-1 bg-gradient-to-r from-[#0d3b78] via-[#d4af37] to-[#0d3b78]" />

        </div>


        {/* =====================================================
            MEMBER SEARCH
        ===================================================== */}

        <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#d4af37]/25 bg-white shadow-sm sm:mt-7 sm:rounded-[1.75rem]">

          <div className="p-4 sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d3b78] to-[#174d91] text-white shadow-md sm:h-12 sm:w-12 sm:rounded-2xl">

                  <UserRoundSearch size={20} />

                </div>

                <div className="min-w-0">

                  <h3 className="font-bold text-[#172033]">
                    አባል ፈልግ
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-gray-500 sm:text-xs">
                    በስም፣ በምዝገባ ቁጥር ወይም በስልክ ይፈልጉ
                  </p>

                </div>

              </div>


              <form
                action="/dashboard/student"
                method="GET"
                className="flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:max-w-2xl"
              >

                <div className="relative min-w-0 flex-1">

                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 sm:left-4"
                  />

                  <input
                    type="text"
                    name="search"
                    placeholder="የአባሉን ስም፣ ምዝገባ ቁጥር ወይም ስልክ..."
                    className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-[#fafafa] py-3 pl-10 pr-3 text-sm text-[#172033] outline-none transition duration-200 hover:border-slate-300 focus:border-[#0d3b78] focus:bg-white focus:ring-4 focus:ring-[#0d3b78]/10 sm:pl-11 sm:pr-4"
                  />

                </div>


                <button
                  type="submit"
                  className="inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d3b78] to-[#174d91] px-6 py-3 text-sm font-bold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] sm:w-auto"
                >

                  <Search size={17} />

                  ፈልግ

                </button>

              </form>

            </div>

          </div>

        </div>


        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-4 lg:grid-cols-4">

          <DashboardCard
            title="ጠቅላላ አባላት"
            value={String(totalMembers ?? 0)}
            icon={<Users size={22} />}
            description="በስርዓቱ ውስጥ"
          />

          <DashboardCard
            title="ወንድ አባላት"
            value={String(maleMembers ?? 0)}
            icon={<UserRound size={22} />}
            description="ወንድ አባላት"
          />

          <DashboardCard
            title="ሴት አባላት"
            value={String(femaleMembers ?? 0)}
            icon={<UserRound size={22} />}
            description="ሴት አባላት"
          />

          <DashboardCard
            title="ዛሬ የተመዘገቡ"
            value={String(todayMembers ?? 0)}
            icon={<UserPlus size={22} />}
            description="የዛሬ ምዝገባ"
          />

        </div>


        {/* =====================================================
            ADMINISTRATION ACTIONS
        ===================================================== */}

        <div className="mt-7 sm:mt-10">

          <div className="mb-4 sm:mb-5">

            <div className="flex items-center gap-3">

              <div className="h-8 w-1 shrink-0 rounded-full bg-[#d4af37]" />

              <div className="min-w-0">

                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d4af37] sm:text-[11px]">
                  ADMINISTRATION
                </p>

                <h3 className="mt-1 text-lg font-bold text-[#172033] sm:text-xl">
                  የአስተዳዳሪ እርምጃዎች
                </h3>

              </div>

            </div>

          </div>


          <div className="grid grid-cols-1 gap-3.5 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* ADD MEMBER */}

            <Link
              href="/dashboard/students/new"
              className="group block min-w-0"
            >

              <div className="relative h-full overflow-hidden rounded-[1.35rem] border border-[#d4af37]/25 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-xl sm:rounded-[1.75rem] sm:p-7">

                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#0d3b78]/[0.035] transition duration-500 group-hover:scale-125" />

                <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[#d4af37]/[0.035] transition duration-500 group-hover:scale-125" />

                <div className="relative flex items-start justify-between gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d3b78] to-[#174d91] text-white shadow-md transition duration-300 group-hover:scale-105 group-hover:shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl">

                    <UserRoundPlus size={25} />

                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8f5ec] text-gray-400 transition duration-300 group-hover:bg-[#d4af37]/15 group-hover:text-[#0d3b78] sm:h-9 sm:w-9">

                    <ArrowRight size={17} />

                  </div>

                </div>

                <div className="relative">

                  <h4 className="mt-5 text-base font-bold text-[#172033] sm:mt-6 sm:text-lg">
                    አዲስ አባል መመዝገብ
                  </h4>

                  <p className="mt-2 text-[13px] leading-6 text-gray-500 sm:text-sm">
                    አዲስ አባልን በምዝገባ ስርዓቱ ውስጥ
                    በሙሉ መረጃ ይመዝግቡ።
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b78] sm:mt-5">

                    ምዝገባ ጀምር

                    <ChevronRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />

                  </div>

                </div>

              </div>

            </Link>


            {/* MEMBER LIST */}

            <Link
              href="/dashboard/student"
              className="group block min-w-0"
            >

              <div className="relative h-full overflow-hidden rounded-[1.35rem] border border-[#d4af37]/25 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-xl sm:rounded-[1.75rem] sm:p-7">

                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#d4af37]/[0.07] transition duration-500 group-hover:scale-125" />

                <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[#0d3b78]/[0.025] transition duration-500 group-hover:scale-125" />

                <div className="relative flex items-start justify-between gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#f8f5ec] text-[#0d3b78] shadow-sm transition duration-300 group-hover:scale-105 group-hover:bg-[#d4af37]/10 group-hover:shadow-md sm:h-14 sm:w-14 sm:rounded-2xl">

                    <Users size={25} />

                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8f5ec] text-gray-400 transition duration-300 group-hover:bg-[#d4af37]/15 group-hover:text-[#0d3b78] sm:h-9 sm:w-9">

                    <ArrowRight size={17} />

                  </div>

                </div>

                <div className="relative">

                  <h4 className="mt-5 text-base font-bold text-[#172033] sm:mt-6 sm:text-lg">
                    የአባላት ዝርዝር
                  </h4>

                  <p className="mt-2 text-[13px] leading-6 text-gray-500 sm:text-sm">
                    የተመዘገቡ አባላትን ይመልከቱ፣
                    ይፈልጉ እና መረጃቸውን ያስተዳድሩ።
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b78] sm:mt-5">

                    ዝርዝር ክፈት

                    <ChevronRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />

                  </div>

                </div>

              </div>

            </Link>


            {/* MEZMUR ATTENDANCE */}

            <Link
              href="/dashboard/attendance/mezmur"
              className="group block min-w-0"
            >

              <div className="relative h-full overflow-hidden rounded-[1.35rem] border border-[#d4af37]/25 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-xl sm:rounded-[1.75rem] sm:p-7">

                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#0d3b78]/[0.035] transition duration-500 group-hover:scale-125" />

                <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[#d4af37]/[0.045] transition duration-500 group-hover:scale-125" />

                <div className="relative flex items-start justify-between gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d3b78] to-[#174d91] text-white shadow-md transition duration-300 group-hover:scale-105 group-hover:shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl">

                    <ClipboardCheck size={25} />

                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8f5ec] text-gray-400 transition duration-300 group-hover:bg-[#d4af37]/15 group-hover:text-[#0d3b78] sm:h-9 sm:w-9">

                    <ArrowRight size={17} />

                  </div>

                </div>

                <div className="relative">

                  <h4 className="mt-5 text-base font-bold text-[#172033] sm:mt-6 sm:text-lg">
                    የመዝሙር ክትትል
                  </h4>

                  <p className="mt-2 text-[13px] leading-6 text-gray-500 sm:text-sm">
                    የመዝሙር ክፍሎችን አባላት ይመድቡ፣
                    የዕለት ተዕለት መገኘትን ይመዝግቡ
                    እና የአባላትን ክትትል ይመልከቱ።
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b78] sm:mt-5">

                    ክትትል ጀምር

                    <ChevronRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />

                  </div>

                </div>

              </div>

            </Link>

          </div>

        </div>


        {/* =====================================================
            EDUCATION / COURSES
        ===================================================== */}

        <div className="mt-7 sm:mt-10">

          <div className="mb-4 sm:mb-5">

            <div className="flex items-center gap-3">

              <div className="h-8 w-1 shrink-0 rounded-full bg-[#d4af37]" />

              <div className="min-w-0">

                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d4af37] sm:text-[11px]">
                  EDUCATION
                </p>

                <h3 className="mt-1 text-lg font-bold text-[#172033] sm:text-xl">
                  ትምህርት እና ኮርሶች
                </h3>

              </div>

            </div>

          </div>


          <div className="relative overflow-hidden rounded-[1.35rem] border border-[#d4af37]/30 bg-gradient-to-br from-[#082f63] via-[#0d3b78] to-[#174d91] shadow-lg sm:rounded-[2rem]">

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[#d4af37]/20" />

            <div className="pointer-events-none absolute -right-5 -top-5 h-32 w-32 rounded-full border border-white/5" />

            <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full border border-white/5" />


            <div className="relative p-5 sm:p-8">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex min-w-0 items-start gap-3 sm:gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/15 text-[#f5d77a] shadow-inner sm:h-14 sm:w-14 sm:rounded-2xl">

                    <BookOpen size={25} />

                  </div>

                  <div className="min-w-0">

                    <h4 className="text-base font-bold text-white sm:text-lg">
                      የአባላት ትምህርት አስተዳደር
                    </h4>

                    <p className="mt-2 max-w-xl text-[13px] leading-6 text-blue-100/80 sm:text-sm">
                      የአባላትን የትምህርት ደረጃ፣
                      ኮርሶች እና የትምህርት መዝገቦች
                      ለማስተዳደር የሚያገለግል ክፍል።
                    </p>

                  </div>

                </div>


                <div className="flex w-full sm:w-auto">

                  <Link
                    href="/dashboard/academic-years"
                    className="group inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e3c75e] px-5 py-3 text-sm font-bold text-[#172033] shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
                  >

                    <BookOpen size={17} />

                    ኮርሶች

                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />

                  </Link>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-7 pb-5 pt-3 text-center sm:mt-10 sm:pb-6 sm:pt-4">

          <div className="mb-4 flex items-center justify-center gap-2 sm:gap-3">

           

          </div>

          <p className="text-xs font-semibold text-[#0d3b78]">
            ጽርሐ ጽዮን ሰንበት ት/ቤት
          </p>

         

        </footer>

      </section>

    </main>
  );
}


/* ============================================================
   DASHBOARD STATISTICS CARD
============================================================ */

function DashboardCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[1.15rem] border border-[#d4af37]/20 bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/45 hover:shadow-lg sm:rounded-[1.5rem] sm:p-5">

      {/* Left gold accent */}

      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#d4af37]/50 to-[#d4af37]/20 transition duration-300 group-hover:from-[#d4af37] group-hover:to-[#d4af37]/50" />

      {/* Background decoration */}

      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#0d3b78]/[0.025] transition duration-300 group-hover:scale-125" />


      <div className="relative flex min-w-0 items-center justify-between gap-1.5 sm:gap-4">

        <div className="min-w-0">

          <p className="truncate text-[9px] font-semibold text-gray-500 sm:text-xs">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold tracking-tight text-[#0d3b78] sm:mt-2 sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 truncate text-[8px] text-gray-400 sm:text-[11px]">
            {description}
          </p>

        </div>


        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0d3b78]/10 text-[#0d3b78] transition duration-300 group-hover:bg-[#d4af37]/15 group-hover:text-[#0d3b78] sm:h-12 sm:w-12 sm:rounded-2xl">

          {icon}

        </div>

      </div>

    </div>
  );
}
