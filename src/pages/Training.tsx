
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, CalendarDays, Check,
  CheckCircle2, Clock, Dumbbell, Flame, Play, Save, Timer, TrendingUp, UserRound, Zap, Droplets, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Category = "Strength" | "Cardio" | "Yoga" | "Warm-up" | "Walking" | "Running";

type Exercise = {
  id: number;
  name: string;
  category: Category;
  level: string;
  duration: number;
  calories: number;
  description: string;
  benefits: string;
  preferences: string[];
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  fitness_goal: string | null;
  medical_conditions?: string | null;
  activity_level?: string | null;
  workout_preferences?: string[] | null;
};

type DailyPlan = {
  id?: number;
  user_id: string;
  plan_date: string;
  exercise_ids: number[];
  preference: string | null;
  goal: string | null;
  water_target_liters: number;
  water_consumed_liters: number;
  calorie_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fats_target_g: number | null;
};

type WorkoutRecord = {
  id: number;
  exercise_name: string;
  category: string;
  duration: number;
  calories: number;
  completed: boolean;
  completed_at: string;
};

const exercises: Exercise[] = [
  {
    id: 1, name: "Gentle Warm-up", category: "Warm-up",
    level: "Beginner", duration: 5, calories: 20,
    description: "March in place, shoulder circles and gentle movements.",
    benefits: "Prepare your body for exercise.", preferences: ["Warm-up"],
  },
  {
    id: 2, name: "Walking", category: "Walking",
    level: "Beginner", duration: 15, calories: 60,
    description: "Walk at a comfortable pace and gradually build consistency.",
    benefits: "Build a daily movement habit.", preferences: ["Walking", "Cardio"],
  },
  {
    id: 3, name: "Brisk Walking", category: "Walking",
    level: "Beginner", duration: 20, calories: 90,
    description: "Walk faster while still being able to talk comfortably.",
    benefits: "Support cardiovascular fitness.", preferences: ["Walking", "Cardio"],
  },
  {
    id: 4, name: "Easy Jogging", category: "Running",
    level: "Intermediate", duration: 15, calories: 130,
    description: "Try an easy jog only if it is comfortable and appropriate for you.",
    benefits: "Develop aerobic endurance.", preferences: ["Running", "Cardio"],
  },
  {
    id: 5, name: "Push-Ups", category: "Strength",
    level: "Beginner", duration: 10, calories: 60,
    description: "Use wall or knee push-ups if regular push-ups are too difficult.",
    benefits: "Train chest, shoulders and arms.", preferences: ["Strength"],
  },
  {
    id: 6, name: "Bodyweight Squats", category: "Strength",
    level: "Beginner", duration: 10, calories: 55,
    description: "Move slowly and use a chair for support if needed.",
    benefits: "Build leg strength.", preferences: ["Strength"],
  },
  {
    id: 7, name: "Wall Push-Ups", category: "Strength",
    level: "Beginner", duration: 5, calories: 25,
    description: "Stand facing a wall and perform controlled push-ups.",
    benefits: "A gentler upper-body option.", preferences: ["Strength"],
  },
  {
    id: 8, name: "Gentle Stretching", category: "Yoga",
    level: "Beginner", duration: 10, calories: 25,
    description: "Use gentle, comfortable stretches without bouncing.",
    benefits: "Support mobility and recovery.", preferences: ["Yoga", "Warm-up"],
  },
  {
    id: 9, name: "Tree Pose Practice", category: "Yoga",
    level: "Beginner", duration: 5, calories: 15,
    description: "Practice balance near a wall or sturdy support.",
    benefits: "Practice balance and focus.", preferences: ["Yoga"],
  },
  {
    id: 10, name: "Plank", category: "Strength",
    level: "Beginner", duration: 5, calories: 25,
    description: "Use a short hold and stop if you feel pain or discomfort.",
    benefits: "Train core stability.", preferences: ["Strength"],
  },
  {
    id: 11, name: "Cycling", category: "Cardio",
    level: "Beginner", duration: 20, calories: 120,
    description: "Cycle at a manageable pace on a safe route or stationary bike.",
    benefits: "Build endurance with low-impact movement.", preferences: ["Cardio"],
  },
  {
    id: 12, name: "Rest and Recovery", category: "Yoga",
    level: "Beginner", duration: 5, calories: 10,
    description: "Take a recovery break, breathe calmly and move gently.",
    benefits: "Make recovery part of your routine.", preferences: ["Yoga", "Warm-up"],
  },
];

const categories: Category[] = [
  "All" as Category, "Warm-up", "Walking", "Running", "Strength", "Cardio", "Yoga",
];

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const dateISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const emptyPlan = (userId: string, date: string): DailyPlan => ({
  user_id: userId,
  plan_date: date,
  exercise_ids: [1, 2, 8],
  preference: null,
  goal: null,
  water_target_liters: 2,
  water_consumed_liters: 0,
  calorie_target: null,
  protein_target_g: null,
  carbs_target_g: null,
  fats_target_g: null,
});

export default function Training() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [plans, setPlans] = useState<Record<string, DailyPlan>>({});
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthDate, setMonthDate] = useState(new Date());
  const [category, setCategory] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2, 8]);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [restActive, setRestActive] = useState(false);
  const [profileForm, setProfileForm] = useState({
    age: "",
    gender: "",
    height: "",
    goal: "General fitness",
    activity: "Beginner",
    medical: "",
    preferences: ["Warm-up", "Walking", "Strength"] as string[],
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setNotice("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      setNotice("Please sign in to save your personal workout plan.");
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setNotice("Could not load your profile. Check your Supabase profile table.");
    }

    if (profileData) {
      const p = profileData as Profile;
      setProfile(p);
      setProfileForm({
        age: p.age == null ? "" : String(p.age),
        gender: p.gender || "",
        height: p.height == null ? "" : String(p.height),
        goal: p.fitness_goal || "General fitness",
        activity: p.activity_level || "Beginner",
        medical: p.medical_conditions || "",
        preferences: p.workout_preferences?.length
          ? p.workout_preferences
          : ["Warm-up", "Walking", "Strength"],
      });
    }

    const { data: weightData } = await supabase
      .from("weight_tracking")
      .select("weight, recorded_at")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setWeight(weightData?.weight == null ? null : Number(weightData.weight));

    const { data: planData, error: planError } = await supabase
      .from("daily_health_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("plan_date", { ascending: false })
      .limit(120);

    if (planError) {
      setNotice("Daily plan table is unavailable. Run the SQL setup shown above.");
    }

    const planMap: Record<string, DailyPlan> = {};
    (planData || []).forEach((row: DailyPlan) => {
      planMap[row.plan_date] = row;
    });
    setPlans(planMap);

    const { data: workoutData, error: workoutError } = await supabase
      .from("workout_tracking")
      .select("id, exercise_name, category, duration, calories, completed, completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(500);

    if (workoutError) {
      setNotice("Could not load workout history. Check workout_tracking permissions.");
    }

    setWorkouts((workoutData || []) as WorkoutRecord[]);

    const todaysPlan = planMap[todayISO()];
    if (todaysPlan) {
      setSelectedIds(todaysPlan.exercise_ids || []);
    } else if (profileData?.workout_preferences?.length) {
      const prefs = profileData.workout_preferences as string[];
      const recommended = exercises
        .filter((e) => e.preferences.some((pref) => prefs.includes(pref)))
        .slice(0, 5)
        .map((e) => e.id);
      setSelectedIds(recommended.length ? recommended : [1, 2, 8]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!restActive) return;
    const timer = window.setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) {
          setRestActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restActive]);

  const currentPlan = plans[selectedDate] || emptyPlan(userId, selectedDate);
  const todaysWorkouts = workouts.filter(
    (w) => w.completed_at && dateISO(new Date(w.completed_at)) === selectedDate
  );
  const todaysWorkoutNames = new Set(todaysWorkouts.map((w) => w.exercise_name));
  const todaysCalories = todaysWorkouts.reduce((sum, w) => sum + (Number(w.calories) || 0), 0);
  const plannedExercises = exercises.filter((e) => selectedIds.includes(e.id));
  const plannedCalories = plannedExercises.reduce((sum, e) => sum + e.calories, 0);
  // Estimates only. Medical conditions can require a clinician-specific plan.
  const targets = useMemo(() => {
    if (!profile || !weight || weight <= 0) {
      return {
        water: 2,
        calories: null as number | null,
        protein: null as number | null,
        carbs: null as number | null,
        fats: null as number | null,
      };
    }

    const age = Number(profile.age);
    const heightCm = Number(profile.height);
    const gender = (profile.gender || "").toLowerCase();

    const water = Math.min(4, Math.max(1.5, weight * 0.035));

    let calories: number | null = null;
    if (age > 0 && heightCm > 0) {
      const base = 10 * weight + 6.25 * heightCm - 5 * age;
      const sexAdjustment =
        gender.includes("male") ? 5 :
        gender.includes("female") ? -161 : -78;
      const activityFactor =
        profile.activity_level === "Active" ? 1.55 :
        profile.activity_level === "Intermediate" ? 1.4 : 1.2;
      const estimate = Math.round((base + sexAdjustment) * activityFactor);
      calories = Math.max(1200, Math.min(4000, estimate));
      if ((profile.fitness_goal || "").toLowerCase().includes("muscle")) {
        calories += 200;
      } else if ((profile.fitness_goal || "").toLowerCase().includes("weight loss")) {
        calories -= 250;
      }
    }

    const protein = Math.round(weight * 1.2);
    const fats = calories ? Math.round((calories * 0.28) / 9) : null;
    const carbs = calories && fats !== null
      ? Math.round((calories - protein * 4 - fats * 9) / 4)
      : null;

    return { water, calories, protein, carbs, fats };
  }, [profile, weight]);

  const recommendations = useMemo(() => {
    const prefs = profileForm.preferences;
    const goal = profileForm.goal.toLowerCase();
    let list = exercises.filter((e) =>
      e.preferences.some((pref) => prefs.includes(pref))
    );

    if (goal.includes("weight loss")) {
      list = list.filter((e) => ["Walking", "Cardio", "Warm-up", "Yoga", "Running"].includes(e.category));
    } else if (goal.includes("muscle") || goal.includes("strength")) {
      list = list.filter((e) => ["Strength", "Warm-up", "Walking"].includes(e.category));
    }

    // Never assume a condition is safe for a particular exercise.
    // When health information is supplied, show low-impact options and a safety note.
    if (profileForm.medical.trim()) {
      list = list.filter((e) =>
        ["Walking", "Warm-up", "Yoga"].includes(e.category)
      );
    }

    return list.slice(0, 5);
  }, [profileForm]);

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setNotice("");

    const updates = {
      id: userId,
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      age: profileForm.age ? Number(profileForm.age) : null,
      gender: profileForm.gender || null,
      height: profileForm.height ? Number(profileForm.height) : null,
      fitness_goal: profileForm.goal,
      activity_level: profileForm.activity,
      medical_conditions: profileForm.medical.trim() || null,
      workout_preferences: profileForm.preferences,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(updates, { onConflict: "id" });

    if (error) {
      setNotice(`Profile could not be saved: ${error.message}`);
    } else {
      setProfile((old) => ({ ...(old || { id: userId, full_name: null, email: null }), ...updates }));
      setEditingProfile(false);
      setNotice("Profile and preferences saved.");
    }
    setSaving(false);
  };

  const saveDailyPlan = async () => {
    if (!userId) {
      setNotice("Sign in first to save your daily plan.");
      return;
    }
    setSaving(true);
    setNotice("");

    const row: DailyPlan = {
      ...currentPlan,
      user_id: userId,
      plan_date: selectedDate,
      exercise_ids: selectedIds,
      preference: profileForm.preferences.join(", "),
      goal: profileForm.goal,
      water_target_liters: targets.water,
      calorie_target: targets.calories,
      protein_target_g: targets.protein,
      carbs_target_g: targets.carbs,
      fats_target_g: targets.fats,
    };

    const { data, error } = await supabase
      .from("daily_health_plans")
      .upsert(row, { onConflict: "user_id,plan_date" })
      .select()
      .single();

    if (error) {
      setNotice(`Plan could not be saved: ${error.message}`);
    } else {
      setPlans((old) => ({ ...old, [selectedDate]: data as DailyPlan }));
      setNotice(`Workout plan saved for ${selectedDate}.`);
    }
    setSaving(false);
  };

  const addWater = async (amount: number) => {
    if (!userId) return;
    const next = Math.min(10, Number((currentPlan.water_consumed_liters + amount).toFixed(2)));
    const row = {
      ...currentPlan,
      user_id: userId,
      plan_date: selectedDate,
      exercise_ids: selectedIds,
      preference: profileForm.preferences.join(", "),
      goal: profileForm.goal,
      water_target_liters: targets.water,
      water_consumed_liters: next,
      calorie_target: targets.calories,
      protein_target_g: targets.protein,
      carbs_target_g: targets.carbs,
      fats_target_g: targets.fats,
    };

    const { data, error } = await supabase
      .from("daily_health_plans")
      .upsert(row, { onConflict: "user_id,plan_date" })
      .select()
      .single();

    if (error) {
      setNotice(`Water log could not be saved: ${error.message}`);
      return;
    }
    setPlans((old) => ({ ...old, [selectedDate]: data as DailyPlan }));
    setNotice(`${amount.toFixed(2)} L added to your water log.`);
  };

  const finishExercise = async (exercise: Exercise) => {
    if (!userId) {
      setNotice("Sign in to save completed workouts.");
      return;
    }

    setSaving(true);
    setNotice("");

    const durationMinutes = Math.max(1, Math.ceil(elapsed / 60));
    const { error } = await supabase.from("workout_tracking").insert({
      user_id: userId,
      exercise_name: exercise.name,
      category: exercise.category,
      duration: durationMinutes,
      calories: exercise.calories,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      setNotice(`Workout could not be saved: ${error.message}`);
      setSaving(false);
      return;
    }

    setWorkouts((old) => [{
      id: Date.now(),
      exercise_name: exercise.name,
      category: exercise.category,
      duration: durationMinutes,
      calories: exercise.calories,
      completed: true,
      completed_at: new Date().toISOString(),
    }, ...old]);

    setActiveExercise(null);
    setIsRunning(false);
    setElapsed(0);
    setNotice(`${exercise.name} completed and saved to your history.`);
    setSaving(false);
  };

  const changePreference = (pref: string) => {
    setProfileForm((old) => ({
      ...old,
      preferences: old.preferences.includes(pref)
        ? old.preferences.filter((p) => p !== pref)
        : [...old.preferences, pref],
    }));
  };

  const calendarCells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: count }, (_, i) => dateISO(new Date(year, month, i + 1))),
    ];
  }, [monthDate]);

  const daysWithWorkouts = new Set(
    workouts.map((w) => dateISO(new Date(w.completed_at)))
  );

  const filteredExercises = exercises.filter((e) =>
    category === "All" || e.category === category
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b09] text-lime-400">
        Loading your personalized training plan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b09] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b09]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <Activity size={23} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide">
                WE<span className="text-lime-400">HEALTHY</span>
              </h1>
              <p className="text-[10px] tracking-[0.25em] text-gray-500">PERSONAL FITNESS</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-gray-400 md:flex">
            <Link to="/" className="hover:text-lime-400">Home</Link>
            <Link to="/dashboard" className="hover:text-lime-400">Dashboard</Link>
            <span className="font-semibold text-lime-400">Training</span>
          </nav>
          <Link to="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-lime-400/50">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8">
        {notice && (
          <div className="rounded-xl border border-lime-400/20 bg-lime-400/5 p-4 text-sm text-lime-200">
            {notice}
          </div>
        )}

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#202b17] via-[#141914] to-[#101210] p-7 md:grid-cols-[1.3fr_1fr] md:p-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-300">
              <Zap size={15} /> YOUR PERSONAL FITNESS PLAN
            </p>
            <h2 className="text-4xl font-black leading-tight md:text-5xl">
              Train for <span className="text-lime-400">your goals.</span>
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-gray-400">
              Build a daily plan around your goals and preferences, then track your activity and hydration on your calendar.
            </p>
            <button onClick={() => setEditingProfile(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-bold text-black hover:bg-lime-300">
              <UserRound size={18} /> Personalize My Plan
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={<Flame size={22} />} label="Completed today" value={`${todaysWorkouts.length}`} />
            <Metric icon={<TrendingUp size={22} />} label="Workout calories*" value={`${todaysCalories} kcal`} />
            <Metric icon={<Droplets size={22} />} label="Water target*" value={`${targets.water.toFixed(1)} L`} />
            <Metric icon={<Dumbbell size={22} />} label="Plan exercises" value={`${selectedIds.length}`} />
          </div>
          <p className="text-xs text-gray-500 md:col-span-2">
            *Estimates only. Exercise calorie values are approximations, not measurements.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-lime-400">YOUR PROFILE</p>
                <h2 className="mt-2 text-2xl font-black">{profile?.full_name || "Fitness member"}</h2>
                <p className="mt-1 text-sm text-gray-500">{profile?.fitness_goal || "Set your fitness goal to personalize recommendations."}</p>
              </div>
              <button onClick={() => setEditingProfile(true)} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-lime-400/50">
                Edit profile
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SmallStat label="Age" value={profile?.age ? `${profile.age} years` : "Not set"} />
              <SmallStat label="Gender" value={profile?.gender || "Not set"} />
              <SmallStat label="Height" value={profile?.height ? `${profile.height} cm` : "Not set"} />
              <SmallStat label="Latest weight" value={weight ? `${weight} kg` : "Not set"} />
            </div>
            <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-gray-200">Exercise preferences</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profileForm.preferences.map((p) => (
                  <span key={p} className="rounded-full border border-lime-400/20 bg-lime-400/5 px-3 py-1 text-xs text-lime-200">{p}</span>
                ))}
                {!profileForm.preferences.length && <span className="text-sm text-gray-500">Choose your preferred activities.</span>}
              </div>
              {profileForm.medical.trim() && (
                <p className="mt-4 flex gap-2 text-sm text-amber-300">
                  <AlertTriangle size={18} className="shrink-0" />
                  You reported a health condition. Please confirm exercise, hydration and nutrition targets with a qualified clinician before following this plan.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <Droplets className="text-sky-300" size={24} />
              <div>
                <h3 className="font-bold">Water tracker</h3>
                <p className="text-xs text-gray-500">{selectedDate}</p>
              </div>
            </div>
            <p className="mt-5 text-3xl font-black">
              {currentPlan.water_consumed_liters.toFixed(2)}
              <span className="text-base font-medium text-gray-500"> / {targets.water.toFixed(1)} L</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.min(100, currentPlan.water_consumed_liters / Math.max(targets.water, 0.1) * 100)}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => void addWater(0.25)} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-sky-300/50">+250 ml</button>
              <button onClick={() => void addWater(0.5)} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-sky-300/50">+500 ml</button>
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              The estimate is not appropriate for everyone. Heart, kidney and other conditions may require clinician-directed fluid limits.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <p className="text-xs font-bold tracking-[0.2em] text-lime-400">NUTRITION ESTIMATE</p>
            <h2 className="mt-2 text-2xl font-black">Daily targets</h2>
            <p className="mt-2 text-sm text-gray-500">Calculated when your age, height and weight are available.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Nutrient label="Energy" value={targets.calories ? `${targets.calories} kcal` : "Add profile details"} />
              <Nutrient label="Protein" value={targets.protein ? `${targets.protein} g` : "—"} />
              <Nutrient label="Carbohydrates" value={targets.carbs ? `${targets.carbs} g` : "—"} />
              <Nutrient label="Fats" value={targets.fats ? `${targets.fats} g` : "—"} />
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              These are general estimates, not a meal prescription. Actual needs depend on health, activity, goals and clinician or dietitian advice. Log actual food in your Nutrition page separately.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <p className="text-xs font-bold tracking-[0.2em] text-lime-400">RECOMMENDED FOR YOU</p>
            <h2 className="mt-2 text-2xl font-black">Suggested exercises</h2>
            <p className="mt-2 text-sm text-gray-500">Based on the goal and preferences in your profile.</p>
            <div className="mt-4 space-y-3">
              {recommendations.length ? recommendations.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3">
                  <div>
                    <p className="font-semibold">{exercise.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{exercise.duration} min · {exercise.benefits}</p>
                  </div>
                  <button onClick={() => setSelectedIds((old) => old.includes(exercise.id) ? old : [...old, exercise.id])} className="shrink-0 rounded-lg border border-lime-400/30 px-3 py-2 text-xs text-lime-300">
                    {selectedIds.includes(exercise.id) ? "Selected" : "Add"}
                  </button>
                </div>
              )) : (
                <p className="text-sm text-gray-500">Choose preferences in your profile to get suggestions.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111411] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-lime-400">BUILD YOUR ROUTINE</p>
              <h2 className="mt-2 text-2xl font-black">Choose exercises for {selectedDate}</h2>
              <p className="mt-2 text-sm text-gray-500">Select any exercises you want in this day's plan.</p>
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-[#090b09] px-3 py-2 text-sm text-white">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.map((exercise) => {
              const chosen = selectedIds.includes(exercise.id);
              const completedToday = todaysWorkoutNames.has(exercise.name);
              return (
                <article key={exercise.id} className={`rounded-xl border p-4 ${chosen ? "border-lime-400/40 bg-lime-400/5" : "border-white/10 bg-black/10"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">{exercise.category}</span>
                    {completedToday && <span className="text-xs text-lime-300">Completed today</span>}
                  </div>
                  <h3 className="mt-4 font-bold">{exercise.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">{exercise.description}</p>
                  <div className="mt-3 flex gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={14} />{exercise.duration} min</span>
                    <span className="flex items-center gap-1"><Flame size={14} />~{exercise.calories} kcal</span>
                  </div>
                  <button onClick={() => setSelectedIds((old) => chosen ? old.filter((id) => id !== exercise.id) : [...old, exercise.id])} className={`mt-4 w-full rounded-lg py-2.5 text-sm font-bold ${chosen ? "border border-lime-400/40 text-lime-300" : "bg-lime-400 text-black"}`}>
                    {chosen ? "Remove from plan" : "Add to plan"}
                  </button>
                  <button onClick={() => { setActiveExercise(exercise); setElapsed(0); setIsRunning(true); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm hover:border-lime-400/40">
                    <Play size={15} /> Start timer
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 p-4">
            <div className="text-sm text-gray-400">
              <span className="font-bold text-white">{selectedIds.length}</span> selected ·
              <span className="ml-1 font-bold text-lime-300">~{plannedCalories} kcal</span> estimated
            </div>
            <button disabled={saving} onClick={() => void saveDailyPlan()} className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-bold text-black disabled:opacity-50">
              <Save size={17} /> {saving ? "Saving..." : "Save Daily Plan"}
            </button>
          </div>
        </section>

        {activeExercise && (
          <section className="rounded-2xl border border-lime-400/30 bg-lime-400/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-lime-400">CURRENT WORKOUT</p>
                <h2 className="mt-2 text-2xl font-black">{activeExercise.name}</h2>
                <p className="mt-2 text-sm text-gray-400">{activeExercise.description}</p>
              </div>
              <div className="rounded-xl bg-black/30 px-5 py-3 text-center">
                <Timer className="mx-auto mb-2 text-lime-400" size={22} />
                <p className="text-2xl font-black tabular-nums">{formatTime(elapsed)}</p>
                <p className="text-xs text-gray-500">Elapsed time</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setIsRunning((old) => !old)} className="rounded-xl bg-lime-400 px-5 py-3 font-bold text-black">
                {isRunning ? "Pause timer" : "Resume timer"}
              </button>
              <button disabled={saving} onClick={() => void finishExercise(activeExercise)} className="inline-flex items-center gap-2 rounded-xl border border-lime-400/40 px-5 py-3 font-semibold text-lime-300 disabled:opacity-50">
                <CheckCircle2 size={18} /> {saving ? "Saving..." : "Complete & Save"}
              </button>
              <button onClick={() => { setActiveExercise(null); setIsRunning(false); setElapsed(0); }} className="rounded-xl border border-white/10 px-5 py-3 text-gray-300">Cancel</button>
            </div>
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-lime-400" size={23} />
              <div>
                <h2 className="text-xl font-black">Workout calendar</h2>
                <p className="text-xs text-gray-500">Choose a date to view or plan your activity.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <button aria-label="Previous month" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))} className="rounded-lg border border-white/10 p-2"><ChevronLeft size={18} /></button>
              <p className="font-bold">{monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
              <button aria-label="Next month" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))} className="rounded-lg border border-white/10 p-2"><ChevronRight size={18} /></button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="py-2">{d}</div>)}
              {calendarCells.map((day, index) => day ? (
                <button key={day} onClick={() => setSelectedDate(day)} className={`relative rounded-lg py-3 text-sm ${selectedDate === day ? "bg-lime-400 font-bold text-black" : "hover:bg-white/10"} ${day === todayISO() && selectedDate !== day ? "border border-lime-400/50" : ""}`}>
                  {Number(day.slice(-2))}
                  {(daysWithWorkouts.has(day) || plans[day]) && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selectedDate === day ? "bg-black" : "bg-lime-400"}`} />}
                </button>
              ) : <div key={`blank-${index}`} />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-lime-400" /> Workout or saved plan</span>
              <span>Selected: <strong className="text-white">{selectedDate}</strong></span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <h2 className="text-xl font-black">Activity on {selectedDate}</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <SmallStat label="Completed" value={`${todaysWorkouts.length} workouts`} />
              <SmallStat label="Calories*" value={`${todaysCalories} kcal`} />
              <SmallStat label="Planned" value={`${selectedIds.length} exercises`} />
            </div>
            <div className="mt-5 space-y-3">
              {todaysWorkouts.length ? todaysWorkouts.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3">
                  <div className="flex items-center gap-3">
                    <Check className="text-lime-400" size={18} />
                    <div>
                      <p className="font-semibold">{w.exercise_name}</p>
                      <p className="text-xs text-gray-500">{w.category} · {w.duration} min recorded</p>
                    </div>
                  </div>
                  <span className="text-xs text-lime-300">Done</span>
                </div>
              )) : <p className="text-sm text-gray-500">No completed workouts saved for this date yet.</p>}
            </div>
            <p className="mt-4 text-xs text-gray-500">*Workout calorie values are rough estimates.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111411] p-6">
          <div className="flex items-center gap-3">
            <Timer className="text-lime-400" size={22} />
            <div>
              <h2 className="font-bold">Rest timer</h2>
              <p className="text-xs text-gray-500">Take a break between sets.</p>
            </div>
          </div>
          <p className="my-5 text-center text-5xl font-black tabular-nums">{formatTime(restSeconds)}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[30, 60, 90].map((seconds) => (
              <button key={seconds} onClick={() => { setRestSeconds(seconds); setRestActive(false); }} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-lime-400/50">{seconds}s</button>
            ))}
            <button onClick={() => { if (restSeconds === 0) setRestSeconds(60); setRestActive((old) => !old); }} className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-bold text-black">{restActive ? "Pause" : "Start"}</button>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 WEHEALTHY. Build healthy habits every day.</p>
          <Link to="/dashboard" className="flex items-center gap-2 text-lime-400 hover:text-lime-300">Back to Dashboard <ArrowRight size={15} /></Link>
        </footer>
      </main>

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111411] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-lime-400">PERSONALIZATION</p>
                <h2 className="mt-2 text-2xl font-black">Your fitness profile</h2>
              </div>
              <button onClick={() => setEditingProfile(false)} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Close</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Age (years)" value={profileForm.age} type="number" onChange={(v) => setProfileForm((p) => ({ ...p, age: v }))} />
              <Field label="Height (cm)" value={profileForm.height} type="number" onChange={(v) => setProfileForm((p) => ({ ...p, height: v }))} />
              <div>
                <label className="mb-2 block text-sm text-gray-400">Gender (optional)</label>
                <select value={profileForm.gender} onChange={(e) => setProfileForm((p) => ({ ...p, gender: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#090b09] p-3 text-white">
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Fitness goal</label>
                <select value={profileForm.goal} onChange={(e) => setProfileForm((p) => ({ ...p, goal: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#090b09] p-3 text-white">
                  {["General fitness", "Weight loss", "Build muscle", "Improve strength", "Improve endurance", "Flexibility"].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Activity level</label>
                <select value={profileForm.activity} onChange={(e) => setProfileForm((p) => ({ ...p, activity: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#090b09] p-3 text-white">
                  {["Beginner", "Intermediate", "Active"].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-400">Health conditions or exercise limitations (optional)</label>
              <textarea value={profileForm.medical} onChange={(e) => setProfileForm((p) => ({ ...p, medical: e.target.value }))} rows={3} placeholder="For example: knee pain, mobility limitation, or a clinician-advised fluid restriction..." className="w-full rounded-xl border border-white/10 bg-[#090b09] p-3 text-sm text-white placeholder:text-gray-600" />
              <p className="mt-2 text-xs text-amber-300">Only share what you are comfortable storing. This app does not diagnose conditions or determine medical exercise restrictions.</p>
            </div>

            <div className="mt-5">
              <label className="mb-3 block text-sm text-gray-400">Preferred workouts</label>
              <div className="flex flex-wrap gap-2">
                {["Warm-up", "Walking", "Running", "Strength", "Cardio", "Yoga"].map((pref) => (
                  <button key={pref} onClick={() => changePreference(pref)} className={`rounded-full border px-4 py-2 text-sm ${profileForm.preferences.includes(pref) ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-white/10 text-gray-400"}`}>
                    {profileForm.preferences.includes(pref) && <Check size={13} className="mr-1 inline" />}{pref}
                  </button>
                ))}
              </div>
            </div>

            <button disabled={saving} onClick={() => void saveProfile()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 font-bold text-black disabled:opacity-50">
              <Save size={17} /> {saving ? "Saving..." : "Save profile & preferences"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 text-lime-400">{icon}</div>
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function Nutrient({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-lime-300">{value}</p>
    </div>
  );
}

function Field({
  label, value, type, onChange,
}: {
  label: string;
  value: string;
  type: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">{label}</label>
      <input
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#090b09] p-3 text-white"
      />
    </div>
  );
}