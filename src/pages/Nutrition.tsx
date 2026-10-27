
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Flame,
  GlassWater,
  Plus,
  Target,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Profile = {
  full_name: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  fitness_goal: string | null;
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

type Meal = {
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
};

const meals: Meal[] = [
  {
    name: "Oats, milk and banana",
    calories: 350,
    protein: 12,
    carbohydrates: 55,
    fats: 9,
  },
  {
    name: "Rice, dal and vegetables",
    calories: 450,
    protein: 16,
    carbohydrates: 75,
    fats: 10,
  },
  {
    name: "Eggs or paneer with roti",
    calories: 400,
    protein: 24,
    carbohydrates: 40,
    fats: 15,
  },
  {
    name: "Fruit and yogurt",
    calories: 180,
    protein: 10,
    carbohydrates: 25,
    fats: 4,
  },
];

function getDayRange() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getTargets(profile: Profile | null, weight: number | null) {
  const defaults = {
    calories: 2000,
    protein: 100,
    carbohydrates: 250,
    fats: 65,
    waterLitres: 2.0,
    personalized: false,
  };

  if (
    !profile ||
    !weight ||
    weight <= 0 ||
    !profile.height ||
    profile.height <= 0 ||
    !profile.age ||
    profile.age <= 0 ||
    profile.age < 18
  ) {
    return defaults;
  }

  const height = Number(profile.height);
  const age = Number(profile.age);
  const gender = (profile.gender ?? "").toLowerCase();

  // Mifflin-St Jeor estimate. Gender options that are not
  // male/female use a midpoint estimate rather than assuming.
  let bmr = 10 * weight + 6.25 * height - 5 * age;

  if (gender.includes("male") && !gender.includes("female")) {
    bmr += 5;
  } else if (gender.includes("female")) {
    bmr -= 161;
  } else {
    bmr -= 78;
  }

  // A moderate activity multiplier is only a starting estimate.
  let calories = bmr * 1.4;
  const goal = (profile.fitness_goal ?? "").toLowerCase();

  if (
    goal.includes("lose weight") ||
    goal.includes("weight loss") ||
    goal.includes("fat loss")
  ) {
    calories -= 250;
  } else if (
    goal.includes("muscle") ||
    goal.includes("gain weight") ||
    goal.includes("weight gain")
  ) {
    calories += 200;
  }

  calories = Math.round(Math.max(1200, Math.min(4500, calories)));

  const protein = Math.round(weight * 1.4);
  const fats = Math.round((calories * 0.25) / 9);
  const carbohydrates = Math.round(
    Math.max(0, calories - protein * 4 - fats * 9) / 4
  );

  // Approximate fluid target. This is not suitable for everyone.
  const waterLitres = Math.max(
    1.5,
    Math.min(4, Math.round(weight * 0.035 * 10) / 10)
  );

  return {
    calories,
    protein,
    carbohydrates,
    fats,
    waterLitres,
    personalized: true,
  };
}

export default function Nutrition() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [todayRowId, setTodayRowId] = useState<number | null>(null);

  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbohydrates, setCarbohydrates] = useState(0);
  const [fats, setFats] = useState(0);
  const [waterLitres, setWaterLitres] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [addedMeals, setAddedMeals] = useState<string[]>([]);

  const targets = useMemo(
    () => getTargets(profile, weight),
    [profile, weight]
  );

  const waterGlasses = Math.round(waterLitres / 0.25);
  const waterGoalGlasses = Math.max(
    1,
    Math.round(targets.waterLitres / 0.25)
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setUserId(null);
      setProfile(null);
      setWeight(null);
      setMessage("Please sign in to view and save your nutrition data.");
      setLoading(false);
      return;
    }

    const id = authData.user.id;
    setUserId(id);

    const [profileResult, weightResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, age, gender, height, fitness_goal")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("weight_tracking")
        .select("weight, recorded_at")
        .eq("user_id", id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      setMessage(`Could not load profile: ${profileResult.error.message}`);
    } else {
      setProfile((profileResult.data as Profile | null) ?? null);
    }

    if (weightResult.error) {
      setMessage(`Could not load weight: ${weightResult.error.message}`);
    } else if (weightResult.data?.weight != null) {
      setWeight(Number(weightResult.data.weight));
    } else {
      setWeight(null);
    }

    const { start, end } = getDayRange();

    const { data: nutritionData, error: nutritionError } = await supabase
      .from("nutrition_tracking")
      .select(
        "id, calories, protein, carbohydrates, fats, water, recorded_at"
      )
      .eq("user_id", id)
      .gte("recorded_at", start)
      .lt("recorded_at", end)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nutritionError) {
      setMessage(`Could not load today's nutrition: ${nutritionError.message}`);
    } else if (nutritionData) {
      const row = nutritionData as NutritionRow;

      setTodayRowId(row.id);
      setCalories(Number(row.calories ?? 0));
      setProtein(Number(row.protein ?? 0));
      setCarbohydrates(Number(row.carbohydrates ?? 0));
      setFats(Number(row.fats ?? 0));
      setWaterLitres(Number(row.water ?? 0));
    } else {
      setTodayRowId(null);
      setCalories(0);
      setProtein(0);
      setCarbohydrates(0);
      setFats(0);
      setWaterLitres(0);
    }

    setAddedMeals([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveNutrition = async () => {
    if (!userId) {
      setMessage("Please sign in before saving nutrition.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      user_id: userId,
      calories: Math.round(calories),
      protein: Number(protein.toFixed(1)),
      carbohydrates: Number(carbohydrates.toFixed(1)),
      fats: Number(fats.toFixed(1)),
      water: Number(waterLitres.toFixed(2)),
      recorded_at: new Date().toISOString(),
    };

    const result =
      todayRowId !== null
        ? await supabase
            .from("nutrition_tracking")
            .update(payload)
            .eq("id", todayRowId)
            .eq("user_id", userId)
            .select("id")
            .single()
        : await supabase
            .from("nutrition_tracking")
            .insert(payload)
            .select("id")
            .single();

    if (result.error) {
      setMessage(`Save failed: ${result.error.message}`);
    } else {
      setTodayRowId(result.data.id);
      setMessage("Today's nutrition has been saved successfully.");
    }

    setSaving(false);
  };

  const addMeal = (meal: Meal) => {
    setCalories((value) => value + meal.calories);
    setProtein((value) => value + meal.protein);
    setCarbohydrates((value) => value + meal.carbohydrates);
    setFats((value) => value + meal.fats);
    setAddedMeals((previous) => [...previous, meal.name]);
    setMessage(`${meal.name} added. Save your nutrition to keep the totals.`);
  };

  const addWater = (amount: number) => {
    setWaterLitres((value) =>
      Math.max(0, Math.min(10, Number((value + amount).toFixed(2))))
    );
  };

  const progress = (value: number, goal: number) =>
    goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;

  const nutritionCards = [
    {
      label: "Calories",
      value: calories,
      goal: targets.calories,
      unit: "kcal",
      icon: Flame,
      color: "bg-lime-400",
    },
    {
      label: "Protein",
      value: protein,
      goal: targets.protein,
      unit: "g",
      icon: Target,
      color: "bg-sky-400",
    },
    {
      label: "Carbohydrates",
      value: carbohydrates,
      goal: targets.carbohydrates,
      unit: "g",
      icon: Activity,
      color: "bg-amber-400",
    },
    {
      label: "Fats",
      value: fats,
      goal: targets.fats,
      unit: "g",
      icon: Droplets,
      color: "bg-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090b09] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b09]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <Activity size={23} />
            </div>
            <div>
              <h1 className="text-xl font-black">
                WE<span className="text-lime-400">HEALTHY</span>
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-gray-500">
                PERSONAL NUTRITION
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
            <Link to="/" className="hover:text-lime-400">Home</Link>
            <Link to="/dashboard" className="hover:text-lime-400">Dashboard</Link>
            <Link to="/training" className="hover:text-lime-400">Training</Link>
            <span className="font-semibold text-lime-400">Nutrition</span>
          </nav>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-lime-400/50"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#26301a] via-[#151a14] to-[#101210] p-7 md:p-10">
          <p className="text-xs font-bold tracking-[0.2em] text-lime-400">
            YOUR PERSONAL PLAN
          </p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">
            Eat for your goals.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-gray-400">
            Daily targets are estimated from your profile and latest recorded
            weight. Track your meals and water to monitor your daily progress.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-500">Profile</p>
              <p className="mt-2 font-bold">
                {profile?.full_name || "Your profile"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-500">Age / Gender</p>
              <p className="mt-2 font-bold">
                {profile?.age ?? "—"} / {profile?.gender || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-500">Height / Weight</p>
              <p className="mt-2 font-bold">
                {profile?.height != null ? `${profile.height} cm` : "Height not set"}
                {" / "}
                {weight != null ? `${weight} kg` : "Weight not recorded"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-500">Fitness goal</p>
              <p className="mt-2 font-bold">
                {profile?.fitness_goal || "Not set"}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-400">
            {targets.personalized
              ? "Targets use an adult calorie estimate and your recorded profile details."
              : "Complete your profile and record your weight to personalize your estimates. For users under 18, these adult calculations are not used."}
          </p>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-bold tracking-[0.2em] text-lime-400">
              DAILY TARGETS
            </p>
            <h2 className="mt-2 text-2xl font-black">What to aim for today</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nutritionCards.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-[#111411] p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lime-400">
                      <Icon size={21} />
                    </div>
                    <span className="text-xs text-gray-500">
                      {progress(item.value, item.goal)}%
                    </span>
                  </div>

                  <p className="mt-5 text-sm text-gray-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-black">
                    {Math.round(item.value)}
                    <span className="ml-1 text-sm font-medium text-gray-500">
                      {item.unit}
                    </span>
                  </p>
                  <div className="my-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${progress(item.value, item.goal)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Estimated target: {item.goal} {item.unit}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400">
                <Utensils size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Meal suggestions</h2>
                <p className="text-xs text-gray-500">
                  Add what you actually eat to today's totals
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {meals.map((meal, index) => (
                <article
                  key={meal.name}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{meal.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        P {meal.protein}g · C {meal.carbohydrates}g · F {meal.fats}g
                      </p>
                    </div>
                    <span className="text-sm font-bold">{meal.calories} kcal</span>
                  </div>
                  <button
                    onClick={() => addMeal(meal)}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-bold text-black hover:bg-lime-300"
                  >
                    <Plus size={16} />
                    Add meal
                  </button>
                </article>
              ))}
            </div>

            {addedMeals.length > 0 && (
              <div className="mt-5 rounded-xl bg-white/5 p-4">
                <p className="text-sm font-semibold">Added this session</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-400">
                  {addedMeals.map((name, index) => (
                    <li key={`${name}-${index}`}>• {name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-400">
                  <GlassWater size={23} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Water tracker</h2>
                  <p className="text-xs text-gray-500">One glass = 250 ml</p>
                </div>
              </div>

              <p className="mt-6 text-3xl font-black">
                {waterLitres.toFixed(2)} L
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {waterGlasses} glasses logged · estimated target{" "}
                {targets.waterLitres.toFixed(1)} L
              </p>

              <div className="my-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{
                    width: `${progress(waterLitres, targets.waterLitres)}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: waterGoalGlasses }, (_, index) => (
                  <div
                    key={index}
                    className={`flex h-9 items-center justify-center rounded-lg ${
                      index < waterGlasses
                        ? "bg-sky-400/20 text-sky-300"
                        : "bg-white/5 text-gray-600"
                    }`}
                  >
                    <GlassWater size={16} />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => addWater(-0.25)}
                  disabled={waterLitres < 0.25}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm disabled:opacity-30"
                >
                  Remove glass
                </button>
                <button
                  onClick={() => addWater(0.25)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-400 py-3 font-bold text-black"
                >
                  <Plus size={17} />
                  Add a glass
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Fluid needs vary with weather, exercise and health. Follow
                your clinician's fluid advice if you have a medical condition
                or fluid restriction.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111411] p-6">
              <div className="flex items-center gap-3">
                <Target className="text-lime-400" size={23} />
                <h2 className="text-xl font-bold">Today's summary</h2>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Calories remaining</span>
                  <strong>{Math.max(0, targets.calories - calories)} kcal</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Protein remaining</span>
                  <strong>{Math.max(0, targets.protein - protein)} g</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Water target progress</span>
                  <strong>{progress(waterLitres, targets.waterLitres)}%</strong>
                </div>
              </div>

              {message && (
                <p className="mt-5 text-sm text-lime-300" role="status">
                  {message}
                </p>
              )}

              <button
                onClick={saveNutrition}
                disabled={saving || loading || !userId}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 font-bold text-black hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={18} />
                {saving ? "Saving..." : "Save Today's Nutrition"}
              </button>

              <button
                onClick={() => void loadData()}
                disabled={loading || saving}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold hover:border-lime-400/50 disabled:opacity-40"
              >
                Reload saved data
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111411] p-6">
          <h2 className="text-lg font-bold">How these targets work</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-400">
            <li>Calories use an adult energy estimate, profile details and a moderate activity assumption.</li>
            <li>Protein, carbohydrates and fats are approximate daily targets, not exact requirements.</li>
            <li>Meal values are estimates and vary with ingredients and serving size. Add a meal only when you actually eat it.</li>
            <li>Medical conditions, medicines, allergies and dietary restrictions are not currently stored in your profile, so this page cannot safely personalize targets for them.</li>
          </ul>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 WEHEALTHY. Build healthy habits every day.</p>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lime-400 hover:text-lime-300"
          >
            Back to Dashboard
            <ArrowRight size={15} />
          </Link>
        </footer>
      </main>
    </div>
  );
}