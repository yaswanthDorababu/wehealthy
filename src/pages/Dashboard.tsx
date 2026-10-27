import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Save,
  Target,
  TrendingUp,
  Utensils,
  UserRound,
  X,
  Ruler,
  Weight,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const quickLinks = [
  {
    title: "Training",
    description: "Build your workout plan",
    icon: Dumbbell,
    path: "/training",
  },
  {
    title: "Nutrition",
    description: "Track your daily nutrition",
    icon: Utensils,
    path: "/nutrition",
  },
  {
    title: "Progress",
    description: "Review your achievements",
    icon: TrendingUp,
    path: "/progress",
  },
];

type DashboardStats = {
  workouts: number;
  activeMinutes: number;
  calories: number;
  water: number;
  weight: number | null;
};

type ProfileForm = {
  full_name: string;
  age: string;
  gender: string;
  height: string;
  fitness_goal: string;
  weight: string;
};

const initialStats: DashboardStats = {
  workouts: 0,
  activeMinutes: 0,
  calories: 0,
  water: 0,
  weight: null,
};

const initialProfile: ProfileForm = {
  full_name: "",
  age: "",
  gender: "",
  height: "",
  fitness_goal: "",
  weight: "",
};

function getLocalDayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getLocalWeekStart() {
  const date = getLocalDayStart();
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [userName, setUserName] = useState("Member");
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);

  const navigate = useNavigate();
  const weeklyGoal = 5;

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setNotice("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (active) navigate("/login", { replace: true });
          return;
        }

        const dayStart = getLocalDayStart();
        const weekStart = getLocalWeekStart();
        const now = new Date();

        const [
          profileResult,
          workoutResult,
          nutritionResult,
          weightResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, age, gender, height, fitness_goal")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("workout_tracking")
            .select("duration, completed_at")
            .eq("user_id", user.id)
            .eq("completed", true)
            .gte("completed_at", weekStart.toISOString())
            .lte("completed_at", now.toISOString()),

          supabase
            .from("nutrition_tracking")
            .select("calories, water, recorded_at")
            .eq("user_id", user.id)
            .gte("recorded_at", dayStart.toISOString())
            .lte("recorded_at", now.toISOString())
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("weight_tracking")
            .select("weight, recorded_at")
            .eq("user_id", user.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!active) return;

        const errors = [
          profileResult.error,
          workoutResult.error,
          nutritionResult.error,
          weightResult.error,
        ].filter(Boolean);

        if (errors.length > 0) {
          console.error("Dashboard loading error:", errors);
          setNotice(
            "Some information could not be loaded. Check your Supabase tables and permissions."
          );
        }

        const savedProfile = profileResult.data;
        const fullName =
          savedProfile?.full_name?.trim() ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "";

        setUserName(fullName || "Member");

        const latestWeight =
          weightResult.data?.weight == null
            ? null
            : Number(weightResult.data.weight);

        setProfile({
          full_name: fullName,
          age:
            savedProfile?.age == null
              ? ""
              : String(savedProfile.age),
          gender: savedProfile?.gender || "",
          height:
            savedProfile?.height == null
              ? ""
              : String(savedProfile.height),
          fitness_goal: savedProfile?.fitness_goal || "",
          weight: latestWeight == null ? "" : String(latestWeight),
        });

        const workoutRows = workoutResult.data ?? [];

        const totalMinutes = workoutRows.reduce(
          (total, workout) =>
            total + (Number(workout.duration) || 0),
          0
        );

        setStats({
          workouts: workoutRows.length,
          activeMinutes: totalMinutes,
          calories: Number(nutritionResult.data?.calories) || 0,
          water: Number(nutritionResult.data?.water) || 0,
          weight: latestWeight,
        });
      } catch (error) {
        console.error("Dashboard loading error:", error);

        if (active) {
          setNotice(
            "Unable to load your dashboard. Please refresh the page and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSaveProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSavingProfile(true);
    setNotice("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      const name = profile.full_name.trim();
      const age = profile.age.trim() ? Number(profile.age) : null;
      const height = profile.height.trim()
        ? Number(profile.height)
        : null;
      const weight = profile.weight.trim()
        ? Number(profile.weight)
        : null;

      if (!name) {
        setNotice("Please enter your full name.");
        return;
      }

      if (
        age !== null &&
        (!Number.isInteger(age) || age < 1 || age > 120)
      ) {
        setNotice("Please enter a valid age between 1 and 120.");
        return;
      }

      if (
        height !== null &&
        (!Number.isFinite(height) || height <= 0 || height > 300)
      ) {
        setNotice("Please enter a valid height in centimetres.");
        return;
      }

      if (
        weight !== null &&
        (!Number.isFinite(weight) || weight <= 0 || weight > 500)
      ) {
        setNotice("Please enter a valid weight in kilograms.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: name,
            email: user.email ?? "",
            age,
            gender: profile.gender || null,
            height,
            fitness_goal: profile.fitness_goal || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      // Record a new weight only when it changes.
      if (
        weight !== null &&
        weight !== stats.weight
      ) {
        const { error: weightError } = await supabase
          .from("weight_tracking")
          .insert({
            user_id: user.id,
            weight,
            recorded_at: new Date().toISOString(),
          });

        if (weightError) {
          console.error("Weight save error:", weightError);
          setNotice(
            "Your profile was saved, but your weight could not be recorded. Check weight_tracking permissions."
          );
        } else {
          setStats((previous) => ({
            ...previous,
            weight,
          }));
        }
      } else {
        setStats((previous) => ({
          ...previous,
          weight,
        }));
      }

      setUserName(name);
      setProfileOpen(false);
    } catch (error) {
      console.error("Profile save error:", error);
      setNotice(
        error instanceof Error
          ? `Could not save your profile: ${error.message}`
          : "Could not save your profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setNotice("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setNotice("Could not sign out. Please try again.");
        return;
      }

      navigate("/login", { replace: true });
    } catch {
      setNotice("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const weeklyProgress = Math.min(
    100,
    Math.round((stats.workouts / weeklyGoal) * 100)
  );

  const overview = [
    {
      title: "Workouts",
      value: stats.workouts.toLocaleString(),
      unit: "sessions",
      icon: Dumbbell,
      detail: "Completed this week",
    },
    {
      title: "Active minutes",
      value: stats.activeMinutes.toLocaleString(),
      unit: "minutes",
      icon: Clock3,
      detail: "From completed workouts",
    },
    {
      title: "Calories",
      value: stats.calories.toLocaleString(),
      unit: "kcal",
      icon: Flame,
      detail: "Today's nutrition log",
    },
    {
      title: "Weekly goal",
      value: `${weeklyProgress}%`,
      unit: "completed",
      icon: Target,
      detail: `${stats.workouts} of ${weeklyGoal} workouts`,
    },
  ];

  const profileDetails = [
    {
      label: "Age",
      value: profile.age ? `${profile.age} years` : "Not added",
      icon: CalendarDays,
    },
    {
      label: "Gender",
      value: profile.gender || "Not added",
      icon: UserRound,
    },
    {
      label: "Height",
      value: profile.height ? `${profile.height} cm` : "Not added",
      icon: Ruler,
    },
    {
      label: "Weight",
      value:
        stats.weight !== null
          ? `${stats.weight} kg`
          : "Not recorded",
      icon: Weight,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090b09] text-white">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/10 bg-[#0e110e] p-6 lg:flex">
        <Link to="/" className="mb-12 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300 text-black">
            <Activity size={25} />
          </span>
          <span className="text-xl font-black tracking-wide">
            WEHEALTHY<span className="text-lime-300">.</span>
          </span>
        </Link>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Workspace
        </p>

        <nav className="space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-xl bg-lime-300/10 px-4 py-3 font-semibold text-lime-300"
          >
            <LayoutDashboard size={19} /> Dashboard
          </Link>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <UserRound size={19} /> My Profile
          </button>

          {quickLinks.map(({ title, icon: Icon, path }) => (
            <Link
              key={title}
              to={path}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              <Icon size={19} /> {title}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-lime-300/20 bg-lime-300/5 p-4">
          <Target className="mb-3 text-lime-300" size={24} />
          <p className="font-semibold">Small steps. Big results.</p>
          <p className="mt-1 text-sm text-gray-400">
            Consistency is your superpower.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-300"
          >
            Explore home <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#090b09]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              className="rounded-lg border border-white/10 p-2 lg:hidden"
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>

            <div>
              <p className="text-sm text-gray-400">
                Welcome back, {userName}
              </p>
              <p className="font-semibold">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 transition hover:border-lime-300/30 hover:bg-white/5"
              title="View and edit your profile"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300/10 font-bold uppercase text-lime-300">
                {userName.charAt(0) || "W"}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">
                My Profile
              </span>
              <Pencil size={15} className="text-gray-400" />
            </button>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-xl border border-white/10 p-2.5 text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile navigation */}
        {menuOpen && (
          <nav className="border-b border-white/10 bg-[#0e110e] p-4 lg:hidden">
            <div className="grid gap-2">
              <Link
                onClick={() => setMenuOpen(false)}
                to="/dashboard"
                className="rounded-xl bg-lime-300/10 p-3 text-lime-300"
              >
                Dashboard
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen(true);
                }}
                className="rounded-xl p-3 text-left text-gray-300 hover:bg-white/5"
              >
                My Profile
              </button>

              {quickLinks.map((item) => (
                <Link
                  key={item.title}
                  onClick={() => setMenuOpen(false)}
                  to={item.path}
                  className="rounded-xl p-3 text-gray-300 hover:bg-white/5"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
          {/* Welcome banner */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#151b14] p-6 sm:p-9">
            <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs font-semibold text-lime-300">
                <HeartPulse size={15} /> YOUR JOURNEY CONTINUES
              </span>

              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
                Build a healthier
                <span className="block text-lime-300">
                  you, every day.
                </span>
              </h1>

              <p className="mt-4 max-w-lg leading-7 text-gray-400">
                Stay consistent, celebrate your progress, and make every
                workout count. Your next step starts here.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/training"
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 font-bold text-black transition hover:bg-lime-200"
                >
                  Explore training <ArrowUpRight size={18} />
                </Link>

               
              </div>
            </div>
          </section>

          {notice && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
            >
              {notice}
            </p>
          )}

          {/* Personal profile */}
          <section className="rounded-3xl border border-white/10 bg-[#111511] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <UserRound size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your personal profile</p>
                  <h2 className="mt-1 text-2xl font-black">
                    {userName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {profile.fitness_goal || "Set your fitness goal"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setProfileOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 font-bold text-black transition hover:bg-lime-200"
              >
                <Pencil size={16} /> Edit Profile
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {profileDetails.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Icon size={17} className="text-lime-300" />
                    {label}
                  </div>
                  <p className="mt-3 text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Daily wellness */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold sm:text-2xl">
                Today&apos;s wellness
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Your latest recorded water and nutrition information.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-400/10 to-[#111511] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Water intake</p>
                    <p className="mt-3 text-3xl font-black">
                      {loading ? "—" : stats.water.toLocaleString()}
                      <span className="ml-2 text-base font-semibold text-gray-400">
                        L
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Recorded in your nutrition log
                    </p>
                  </div>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-400/10 text-sky-300">
                    <Droplets size={29} />
                  </span>
                </div>

                <Link
                  to="/nutrition"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-300 hover:text-sky-200"
                >
                  Update nutrition <ChevronRight size={16} />
                </Link>
              </article>

              <article className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-400/10 to-[#111511] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Exercise this week
                    </p>
                    <p className="mt-3 text-3xl font-black">
                      {loading ? "—" : stats.activeMinutes}
                      <span className="ml-2 text-base font-semibold text-gray-400">
                        min
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      {stats.workouts} completed workout
                      {stats.workouts === 1 ? "" : "s"} this week
                    </p>
                  </div>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-400/10 text-orange-300">
                    <Dumbbell size={29} />
                  </span>
                </div>

                <Link
                  to="/training"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-orange-300 hover:text-orange-200"
                >
                  Go to training <ChevronRight size={16} />
                </Link>
              </article>
            </div>
          </section>

          {/* Overview statistics */}
          <section>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Your overview
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Your personal fitness statistics from Supabase.
                </p>
              </div>

              <span className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays size={15} /> This week
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overview.map(
                ({ title, value, unit, icon: Icon, detail }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-white/10 bg-[#111511] p-5 transition hover:border-lime-300/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {title}
                      </span>
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                        <Icon size={20} />
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-3xl font-black">
                        {loading ? "—" : value}
                      </span>
                      <span className="text-xs text-gray-500">{unit}</span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">{detail}</p>

                    {title === "Weekly goal" && (
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-lime-300 transition-all"
                          style={{
                            width: `${loading ? 0 : weeklyProgress}%`,
                          }}
                        />
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          </section>

          {/* Quick access */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold sm:text-2xl">
                Quick access
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Choose what you want to focus on today.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {quickLinks.map(
                ({ title, description, icon: Icon, path }) => (
                  <Link
                    key={title}
                    to={path}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111511] p-5 transition hover:-translate-y-1 hover:border-lime-300/40"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                      <Icon size={23} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{title}</span>
                      <span className="mt-1 block text-sm text-gray-400">
                        {description}
                      </span>
                    </span>

                    <ChevronRight
                      className="text-gray-500 transition group-hover:translate-x-1 group-hover:text-lime-300"
                      size={19}
                    />
                  </Link>
                )
              )}
            </div>
          </section>

          {/* Weekly goal */}
          <section className="rounded-2xl border border-lime-300/20 bg-gradient-to-br from-lime-300/10 to-[#111511] p-6">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-lime-300 text-black">
              <TrendingUp size={25} />
            </span>

            <h2 className="mt-5 text-xl font-bold">
              Progress starts today
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Track your weight, record workouts, monitor water intake,
              and build a picture of your fitness journey over time.
            </p>

            <div className="mt-6 max-w-xl rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Your weekly milestone</span>
                <Target size={17} className="text-lime-300" />
              </div>

              <p className="mt-2 font-semibold">
                {stats.workouts >= weeklyGoal
                  ? "Weekly workout goal completed!"
                  : `Complete ${weeklyGoal - stats.workouts} more workout${weeklyGoal - stats.workouts === 1 ? "" : "s"} this week`}
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-lime-300 transition-all"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
              <p className="mt-2 text-right text-xs text-gray-500">
                {weeklyProgress}% complete
              </p>
            </div>

            <Link
              to="/progress"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 font-bold text-black transition hover:bg-lime-200"
            >
              View progress <ArrowUpRight size={18} />
            </Link>
          </section>

          <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} WEHEALTHY. Your journey, your progress.
          </footer>
        </main>
      </div>

      {/* Edit profile modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingProfile) {
              setProfileOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111511] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <UserRound size={25} />
                </div>
                <h2
                  id="profile-modal-title"
                  className="text-2xl font-black"
                >
                  Edit your profile
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Keep your personal and fitness information up to date.
                </p>
              </div>

              <button
                type="button"
                disabled={savingProfile}
                onClick={() => setProfileOpen(false)}
                aria-label="Close profile editor"
                className="rounded-xl border border-white/10 p-2 text-gray-400 hover:bg-white/5 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Full name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={profile.full_name}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      full_name: event.target.value,
                    })
                  }
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-white/10 bg-[#090b09] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-lime-300/60"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-age"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    Age
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    min="1"
                    max="120"
                    value={profile.age}
                    onChange={(event) =>
                      setProfile({ ...profile, age: event.target.value })
                    }
                    placeholder="Age in years"
                    className="w-full rounded-xl border border-white/10 bg-[#090b09] px-4 py-3 outline-none focus:border-lime-300/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-gender"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    Gender
                  </label>
                  <select
                    id="profile-gender"
                    value={profile.gender}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        gender: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#090b09] px-4 py-3 outline-none focus:border-lime-300/60"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">
                      Prefer not to say
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="profile-height"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    Height (cm)
                  </label>
                  <input
                    id="profile-height"
                    type="number"
                    min="1"
                    max="300"
                    step="0.1"
                    value={profile.height}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        height: event.target.value,
                      })
                    }
                    placeholder="e.g. 170"
                    className="w-full rounded-xl border border-white/10 bg-[#090b09] px-4 py-3 outline-none focus:border-lime-300/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-weight"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    Current weight (kg)
                  </label>
                  <input
                    id="profile-weight"
                    type="number"
                    min="1"
                    max="500"
                    step="0.1"
                    value={profile.weight}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        weight: event.target.value,
                      })
                    }
                    placeholder="e.g. 65"
                    className="w-full rounded-xl border border-white/10 bg-[#090b09] px-4 py-3 outline-none focus:border-lime-300/60"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Saving a changed weight adds a new weight record.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-goal"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Fitness goal
                </label>
                <select
                  id="profile-goal"
                  value={profile.fitness_goal}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      fitness_goal: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#090b09] px-4 py-3 outline-none focus:border-lime-300/60"
                >
                  <option value="">Choose your fitness goal</option>
                  <option value="Weight loss">Weight loss</option>
                  <option value="Muscle gain">Muscle gain</option>
                  <option value="Build strength">Build strength</option>
                  <option value="Improve endurance">Improve endurance</option>
                  <option value="Stay fit">Stay fit</option>
                  <option value="General health">General health</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => setProfileOpen(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 font-bold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {savingProfile ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}