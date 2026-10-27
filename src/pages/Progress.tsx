
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  RefreshCw,
  Salad,
  Target,
  TrendingUp,
  Dumbbell,
  Scale,
  LockKeyhole,
} from "lucide-react";

type Period = "day" | "week" | "month";

type WeightRow = {
  id: number;
  weight: number;
  recorded_at: string;
};

type WorkoutRow = {
  id: number;
  exercise_name: string | null;
  category: string | null;
  duration: number | null;
  calories: number | null;
  completed: boolean | null;
  completed_at: string | null;
};

type NutritionRow = {
  id: number;
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fats: number | null;
  water: number | null;
  recorded_at: string;
};

type DayActivity = {
  date: string;
  workouts: number;
  minutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  weight: number | null;
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayKey = () => dateKey(new Date());

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateRange(period: Period) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  if (period === "day") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start = startOfWeek(now);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: dateKey(start),
    end: dateKey(end),
    startDate: start,
    endDate: end,
  };
}

function makeEmptyDay(date: string): DayActivity {
  return {
    date,
    workouts: 0,
    minutes: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
    weight: null,
  };
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "lime",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Activity;
  accent?: "lime" | "blue" | "orange" | "purple";
}) {
  const accents = {
    lime: "bg-lime-400/10 text-lime-400",
    blue: "bg-sky-400/10 text-sky-300",
    orange: "bg-orange-400/10 text-orange-300",
    purple: "bg-purple-400/10 text-purple-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111411] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon size={22} />
        </div>
        <span className="text-right text-xs text-gray-500">{title}</span>
      </div>
      <p className="mt-5 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
}) {
  const percentage = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="font-semibold text-white">
          {value.toFixed(1)} / {goal} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-lime-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Progress() {
  const [period, setPeriod] = useState<Period>("day");
  const [weights, setWeights] = useState<WeightRow[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [nutrition, setNutrition] = useState<NutritionRow[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setNotice("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setWeights([]);
      setWorkouts([]);
      setNutrition([]);
      setUserName("");
      setErrorMessage("Please sign in to view your personal activity.");
      setLoading(false);
      return;
    }

    const user = authData.user;
    setUserName(
      String(
        user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "Your"
      )
    );

    const [weightResult, workoutResult, nutritionResult] =
      await Promise.all([
        supabase
          .from("weight_tracking")
          .select("id, weight, recorded_at")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: true }),

        supabase
          .from("workout_tracking")
          .select(
            "id, exercise_name, category, duration, calories, completed, completed_at"
          )
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),

        supabase
          .from("nutrition_tracking")
          .select(
            "id, calories, protein, carbohydrates, fats, water, recorded_at"
          )
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false }),
      ]);

    if (weightResult.error || workoutResult.error || nutritionResult.error) {
      console.error("Progress loading error:", {
        weights: weightResult.error,
        workouts: workoutResult.error,
        nutrition: nutritionResult.error,
      });

      setErrorMessage(
        "Some activity could not be loaded. Check your Supabase table names, columns, and permissions."
      );
    }

    setWeights(
      (weightResult.data ?? []).map((row: {
        id: number | string;
        weight: number | string;
        recorded_at: string;
      }) => ({
        id: Number(row.id),
        weight: Number(row.weight),
        recorded_at: String(row.recorded_at),
      }))
    );

    setWorkouts(
      (workoutResult.data ?? [])
        .filter((row: {
          id: number | string;
          exercise_name: string | null;
          category: string | null;
          duration: number | null;
          calories: number | null;
          completed: boolean | null;
          completed_at: string | null;
        }) => row.completed !== false)
        .map((row: {
          id: number | string;
          exercise_name: string | null;
          category: string | null;
          duration: number | null;
          calories: number | null;
          completed: boolean | null;
          completed_at: string | null;
        }) => ({
          id: Number(row.id),
          exercise_name: row.exercise_name,
          category: row.category,
          duration: Number(row.duration ?? 0),
          calories: Number(row.calories ?? 0),
          completed: row.completed,
          completed_at: row.completed_at,
        }))
    );

    setNutrition(
      (nutritionResult.data ?? []).map((row: {
        id: number | string;
        calories: number | null;
        protein: number | null;
        carbohydrates: number | null;
        fats: number | null;
        water: number | null;
        recorded_at: string;
      }) => ({
        id: Number(row.id),
        calories: Number(row.calories ?? 0),
        protein: Number(row.protein ?? 0),
        carbohydrates: Number(row.carbohydrates ?? 0),
        fats: Number(row.fats ?? 0),
        water: Number(row.water ?? 0),
        recorded_at: String(row.recorded_at),
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const days = useMemo(() => {
    const { startDate, endDate } = getDateRange(period);
    const result: DayActivity[] = [];

    const cursor = new Date(startDate);
    cursor.setHours(12, 0, 0, 0);

    while (cursor <= endDate) {
      result.push(makeEmptyDay(dateKey(cursor)));
      cursor.setDate(cursor.getDate() + 1);
    }

    const byDate = new Map(result.map((day) => [day.date, day]));

    for (const workout of workouts) {
      if (!workout.completed_at) continue;

      const key = workout.completed_at.slice(0, 10);
      const day = byDate.get(key);
      if (!day) continue;

      day.workouts += 1;
      day.minutes += Number(workout.duration ?? 0);
    }

    // Nutrition records may be daily totals updated throughout the day.
    // Keep the newest saved row per date instead of adding duplicate totals.
    const newestNutritionByDate = new Map<string, NutritionRow>();

    for (const entry of nutrition) {
      const key = entry.recorded_at.slice(0, 10);
      if (!byDate.has(key)) continue;

      if (!newestNutritionByDate.has(key)) {
        newestNutritionByDate.set(key, entry);
      }
    }

    for (const [key, entry] of newestNutritionByDate) {
      const day = byDate.get(key);
      if (!day) continue;

      day.calories = Number(entry.calories ?? 0);
      day.protein = Number(entry.protein ?? 0);
      day.carbs = Number(entry.carbohydrates ?? 0);
      day.fats = Number(entry.fats ?? 0);
      day.water = Number(entry.water ?? 0);
    }

    for (const entry of weights) {
      const key = entry.recorded_at.slice(0, 10);
      const day = byDate.get(key);
      if (!day) continue;

      if (day.weight === null) {
        day.weight = entry.weight;
      } else {
        const currentEntryTime = weights
          .filter((item) => item.recorded_at.slice(0, 10) === key)
          .reduce(
            (latest, item) =>
              item.recorded_at > latest.recorded_at ? item : latest,
            entry
          );

        day.weight = currentEntryTime.weight;
      }
    }

    return result;
  }, [period, weights, workouts, nutrition]);

  const summary = useMemo(() => {
    const totalWorkouts = days.reduce((sum, day) => sum + day.workouts, 0);
    const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
    const totalCalories = days.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = days.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = days.reduce((sum, day) => sum + day.carbs, 0);
    const totalFats = days.reduce((sum, day) => sum + day.fats, 0);
    const totalWater = days.reduce((sum, day) => sum + day.water, 0);

    const daysWithWorkout = days.filter((day) => day.workouts > 0).length;
    const daysWithFood = days.filter((day) => day.calories > 0).length;
    const daysWithWater = days.filter((day) => day.water > 0).length;

    const recordedWeights = days.filter(
      (day) => day.weight !== null
    );

    const firstWeight = recordedWeights[0]?.weight ?? null;
    const lastWeight =
      recordedWeights[recordedWeights.length - 1]?.weight ?? null;

    return {
      totalWorkouts,
      totalMinutes,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      totalWater,
      daysWithWorkout,
      daysWithFood,
      daysWithWater,
      firstWeight,
      lastWeight,
      recordedWeightCount: recordedWeights.length,
    };
  }, [days]);

  const activityDays = days.filter(
    (day) =>
      day.workouts > 0 ||
      day.calories > 0 ||
      day.water > 0 ||
      day.weight !== null
  ).length;

  const latestWeight = weights.length
    ? [...weights].sort((a, b) =>
        b.recorded_at.localeCompare(a.recorded_at)
      )[0].weight
    : null;

  const streak = useMemo(() => {
    const activeDates = new Set<string>();

    workouts.forEach((workout) => {
      if (workout.completed_at) {
        activeDates.add(workout.completed_at.slice(0, 10));
      }
    });

    nutrition.forEach((entry) => {
      if (
        Number(entry.calories ?? 0) > 0 ||
        Number(entry.water ?? 0) > 0
      ) {
        activeDates.add(entry.recorded_at.slice(0, 10));
      }
    });

    weights.forEach((entry) => {
      activeDates.add(entry.recorded_at.slice(0, 10));
    });

    let count = 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);

    // A streak can continue from today or yesterday.
    if (!activeDates.has(dateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (activeDates.has(dateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }, [workouts, nutrition, weights]);

  const periodLabel =
    period === "day"
      ? "Today"
      : period === "week"
        ? "This week"
        : "This month";

  return (
    <div className="min-h-screen bg-[#090b09] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b09]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <Activity size={23} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide">
                WE<span className="text-lime-400">HEALTHY</span>
              </h1>
              <p className="text-[10px] tracking-[0.25em] text-gray-500">
                YOUR ACTIVITY
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
            <Link to="/" className="hover:text-lime-400">Home</Link>
            <Link to="/dashboard" className="hover:text-lime-400">Dashboard</Link>
            <Link to="/training" className="hover:text-lime-400">Training</Link>
            <Link to="/nutrition" className="hover:text-lime-400">Nutrition</Link>
            <span className="font-semibold text-lime-400">Progress</span>
          </nav>

          <button
            onClick={() => void loadProgress()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:border-lime-400/50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-5 py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#26301a] via-[#151a14] to-[#101210] p-7 md:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-300">
                <Target size={15} /> YOUR HEALTH AT A GLANCE
              </span>

              <h2 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                {userName ? `Keep going, ${userName.split(" ")[0]}.` : "Your progress."}
                <br />
                <span className="text-lime-400">Every action counts.</span>
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-gray-400">
                See your recorded food, water, workouts, and weight in one
                place. Review your daily habits and follow your progress over
                time.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-white/10 bg-black/25 p-6">
              <p className="text-sm text-gray-400">Current weight</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-black">
                  {latestWeight === null ? "—" : latestWeight.toFixed(1)}
                </span>
                <span className="mb-1 text-gray-400">kg</span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-lime-300">
                <TrendingUp size={17} />
                {streak} day{streak === 1 ? "" : "s"} active streak
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Based on consecutive days with saved activity
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <section
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200"
          >
            <span>{errorMessage}</span>
            <Link to="/login" className="font-bold underline">
              Sign in
            </Link>
          </section>
        )}

        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black">Your activity report</h2>
            <p className="mt-1 text-sm text-gray-500">
              {periodLabel} · {days.length} calendar day
              {days.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex rounded-xl border border-white/10 bg-[#111411] p-1">
            {(["day", "week", "month"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                  period === item
                    ? "bg-lime-400 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Water consumed"
            value={`${summary.totalWater.toFixed(1)} L`}
            subtitle={
              period === "day"
                ? "Water recorded today"
                : `${summary.daysWithWater} day(s) with water records`
            }
            icon={Droplets}
            accent="blue"
          />

          <StatCard
            title="Calories recorded"
            value={summary.totalCalories.toLocaleString()}
            subtitle="From saved nutrition totals"
            icon={Flame}
            accent="orange"
          />

          <StatCard
            title="Workouts completed"
            value={String(summary.totalWorkouts)}
            subtitle={`${summary.totalMinutes} minutes recorded`}
            icon={Dumbbell}
            accent="purple"
          />

          <StatCard
            title="Active days"
            value={`${activityDays} / ${days.length}`}
            subtitle="Days with at least one saved activity"
            icon={CalendarDays}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                <Droplets size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Water intake</h3>
                <p className="text-sm text-gray-500">
                  Water recorded during {periodLabel.toLowerCase()}
                </p>
              </div>
            </div>

            <p className="mt-7 text-4xl font-black">
              {summary.totalWater.toFixed(2)}
              <span className="ml-2 text-base font-medium text-gray-400">litres</span>
            </p>

            <div className="mt-5">
              <ProgressBar
                label={period === "day" ? "Daily reference" : "Average per day"}
                value={
                  period === "day"
                    ? summary.totalWater
                    : summary.totalWater / Math.max(1, days.length)
                }
                goal={2}
                unit="L"
              />
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-500">
              2 L is a general tracking reference, not an individualized
              medical target. Hydration needs vary by person, activity, and
              health conditions.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300">
                <Salad size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Food and nutrition</h3>
                <p className="text-sm text-gray-500">
                  Nutrition totals saved in your account
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-gray-500">Calories</p>
                <p className="mt-2 text-2xl font-black">
                  {Math.round(summary.totalCalories).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">kcal</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-gray-500">Protein</p>
                <p className="mt-2 text-2xl font-black">
                  {summary.totalProtein.toFixed(1)} g
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-gray-500">Carbohydrates</p>
                <p className="mt-2 text-2xl font-black">
                  {summary.totalCarbs.toFixed(1)} g
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-gray-500">Fats</p>
                <p className="mt-2 text-2xl font-black">
                  {summary.totalFats.toFixed(1)} g
                </p>
              </div>
            </div>

            <Link
              to="/nutrition"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-lime-400/30 py-3 font-semibold text-lime-300 hover:bg-lime-400/5"
            >
              Open Nutrition <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300">
                <Dumbbell size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Exercise summary</h3>
                <p className="text-sm text-gray-500">
                  Completed workouts saved to your account
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm text-gray-500">Workout sessions</p>
                <p className="mt-2 text-3xl font-black">
                  {summary.totalWorkouts}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm text-gray-500">Training time</p>
                <p className="mt-2 text-3xl font-black">
                  {summary.totalMinutes}
                  <span className="ml-1 text-sm font-medium text-gray-400">min</span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {workouts
                .filter((workout) => {
                  if (!workout.completed_at) return false;
                  const key = workout.completed_at.slice(0, 10);
                  return days.some((day) => day.date === key);
                })
                .slice(0, 5)
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CheckCircle2 className="shrink-0 text-lime-400" size={19} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {workout.exercise_name || "Workout"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {workout.category || "Exercise"} ·{" "}
                          {workout.completed_at
                            ? formatDate(workout.completed_at.slice(0, 10))
                            : ""}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm text-gray-300">
                      {workout.duration ?? 0} min
                    </span>
                  </div>
                ))}

              {summary.totalWorkouts === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-gray-500">
                  No completed workouts have been recorded for this period.
                  When your Training page saves a workout, it will appear here.
                </p>
              )}
            </div>

            <Link
              to="/training"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 font-bold text-black hover:bg-lime-300"
            >
              Go to Training <ArrowRight size={17} />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400">
                <Scale size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Weight progress</h3>
                <p className="text-sm text-gray-500">
                  Your recorded weight changes
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm text-gray-500">Latest saved weight</p>
              <p className="mt-2 text-4xl font-black">
                {latestWeight === null ? "—" : latestWeight.toFixed(1)}
                <span className="ml-2 text-base font-medium text-gray-400">kg</span>
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {weights
                .filter((entry) =>
                  days.some(
                    (day) => day.date === entry.recorded_at.slice(0, 10)
                  )
                )
                .slice(-5)
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 p-4"
                  >
                    <span className="text-sm text-gray-400">
                      {formatDate(entry.recorded_at.slice(0, 10))}
                    </span>
                    <span className="font-bold">
                      {entry.weight.toFixed(1)} kg
                    </span>
                  </div>
                ))}

              {summary.recordedWeightCount === 0 && (
                <p className="text-sm text-gray-500">
                  No weight entries recorded in this period.
                </p>
              )}
            </div>

            {summary.firstWeight !== null &&
              summary.lastWeight !== null &&
              summary.recordedWeightCount > 1 && (
                <p className="mt-4 text-sm text-gray-400">
                  Change in this period:{" "}
                  <span
                    className={
                      summary.lastWeight <= summary.firstWeight
                        ? "font-bold text-lime-300"
                        : "font-bold text-orange-300"
                    }
                  >
                    {summary.lastWeight > summary.firstWeight ? "+" : ""}
                    {(summary.lastWeight - summary.firstWeight).toFixed(1)} kg
                  </span>
                </p>
              )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111411] p-6 md:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-lime-400">
                <CalendarDays size={19} />
                <span className="text-xs font-bold tracking-[0.2em]">
                  ACTIVITY CALENDAR
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-black">
                {period === "day"
                  ? formatLongDate(todayKey())
                  : period === "week"
                    ? "Your week"
                    : new Date().toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Each date summarizes the activities saved for that day.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-lime-400" />
                Activity recorded
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-white/10" />
                No activity saved
              </span>
            </div>
          </div>

          <div className={`mt-6 grid gap-2 ${
            period === "day" ? "grid-cols-1" : "grid-cols-7"
          }`}>
            {days.map((day) => {
              const hasActivity =
                day.workouts > 0 ||
                day.calories > 0 ||
                day.water > 0 ||
                day.weight !== null;

              const isToday = day.date === todayKey();

              return (
                <div
                  key={day.date}
                  title={`${formatLongDate(day.date)}: ${day.workouts} workout(s), ${day.minutes} minutes, ${day.water.toFixed(1)} L water, ${day.calories} kcal recorded`}
                  className={`min-h-24 rounded-xl border p-3 ${
                    hasActivity
                      ? "border-lime-400/30 bg-lime-400/10"
                      : "border-white/10 bg-white/[0.02]"
                  } ${isToday ? "ring-1 ring-lime-400" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">
                      {formatDate(day.date)}
                    </span>
                    {hasActivity && (
                      <CheckCircle2 size={15} className="text-lime-400" />
                    )}
                  </div>

                  <p className="mt-3 text-lg font-bold">
                    {day.workouts}{" "}
                    <span className="text-xs font-normal text-gray-500">
                      workout{day.workouts === 1 ? "" : "s"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {day.minutes} min · {day.water.toFixed(1)} L water
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {Math.round(day.calories).toLocaleString()} kcal
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-sm text-gray-500">Food logged</p>
              <p className="mt-2 text-2xl font-black">
                {summary.daysWithFood} day(s)
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-sm text-gray-500">Water logged</p>
              <p className="mt-2 text-2xl font-black">
                {summary.daysWithWater} day(s)
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-sm text-gray-500">Exercise logged</p>
              <p className="mt-2 text-2xl font-black">
                {summary.daysWithWorkout} day(s)
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#1c2515] to-[#111411] p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-lime-400">
                <Clock size={19} />
                <span className="text-xs font-bold tracking-[0.2em]">
                  YOUR NEXT STEP
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-black">
                Build your daily routine.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                Log your meals and water in Nutrition, complete and save
                workouts in Training, and return here to review your daily,
                weekly, and monthly records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/nutrition"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-semibold hover:border-lime-400/50"
              >
                Nutrition <ArrowRight size={16} />
              </Link>
              <Link
                to="/training"
                className="flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-bold text-black hover:bg-lime-300"
              >
                Training <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {loading && (
          <p className="text-center text-sm text-gray-500">
            Loading your saved activity...
          </p>
        )}

        {!loading && !errorMessage && (
          <p className="text-center text-xs text-gray-600">
            Activity shown here comes from your saved WEHEALTHY records.
            Unsaved activities are not included.
          </p>
        )}

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 WEHEALTHY. Build healthy habits every day.</p>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lime-400 hover:text-lime-300"
          >
            Back to Dashboard <ArrowRight size={15} />
          </Link>
        </footer>
      </main>
    </div>
  );
}

