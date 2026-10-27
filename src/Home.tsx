
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Droplets,
  Dumbbell,
  HeartPulse,
  Menu,
  ShieldCheck,
  Target,
  Utensils,
  X,
  Zap,
} from "lucide-react";

const pages = [
  {
    name: "Dashboard",
    path: "/dashboard",
    number: "01",
    icon: BarChart3,
    description:
      "Your fitness overview with weekly activity, workout statistics, daily nutrition and personal goals.",
    features: ["Activity summary", "Weekly workout progress", "Goal overview"],
  },
  {
    name: "Training",
    path: "/training",
    number: "02",
    icon: Dumbbell,
    description:
      "Explore workout routines, choose exercises and use your workout timer to manage training sessions.",
    features: ["Strength and cardio", "Exercise categories", "Workout timer"],
  },
  {
    name: "Nutrition",
    path: "/nutrition",
    number: "03",
    icon: Utensils,
    description:
      "Keep your daily food intake and nutrition goals organized in one convenient place.",
    features: ["Calorie tracking", "Protein and macros", "Water tracking"],
  },
  {
    name: "Progress",
    path: "/progress",
    number: "04",
    icon: Activity,
    description:
      "Record your fitness measurements and weight, then review your journey over time.",
    features: ["Weight tracking", "Body measurements", "Fitness history"],
  },
  {
    name: "Contact",
    path: "/contact",
    number: "05",
    icon: HeartPulse,
    description:
      "Find support information and get in touch if you need help using WEHEALTHY.",
    features: ["Contact form", "Support information", "Help with the website"],
  },
];

const benefits = [
  {
    icon: Target,
    title: "Personal fitness goals",
    description:
      "Keep your goals and fitness information organized around your own journey.",
  },
  {
    icon: Dumbbell,
    title: "Workout management",
    description:
      "Explore exercises, organize sessions and build a consistent training habit.",
  },
  {
    icon: Utensils,
    title: "Everyday nutrition",
    description:
      "Track calories, macronutrients and water intake from your nutrition page.",
  },
  {
    icon: BarChart3,
    title: "Progress tracking",
    description:
      "Save your weight and body measurements and review your progress over time.",
  },
];

const beforeLogin = [
  "Explore the website and its features",
  "View the available fitness page descriptions",
  "Create an account or sign in",
];

const afterLogin = [
  "Open your personal dashboard",
  "Use training and nutrition tracking tools",
  "Save and review your fitness records",
  "Manage your goals and measurements",
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-hidden bg-[#090b09] text-white">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b09]/95 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a3ff6b] text-black">
              <Activity size={23} strokeWidth={2.5} />
            </span>

            <span className="text-lg font-black tracking-tight sm:text-xl">
              WE<span className="text-[#a3ff6b]">HEALTHY</span>
              <span className="ml-1 text-xs text-white/40">2.0</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-white/65 lg:flex">
            <a href="#features" className="transition hover:text-[#a3ff6b]">
              Features
            </a>
            <a href="#pages" className="transition hover:text-[#a3ff6b]">
              Explore pages
            </a>
            <a href="#how-it-works" className="transition hover:text-[#a3ff6b]">
              How it works
            </a>
            <Link to="/contact" className="transition hover:text-[#a3ff6b]">
              Contact
            </Link>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-2 rounded-full bg-[#a3ff6b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#b7ff91]"
            >
              Create account <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            className="rounded-xl border border-white/10 p-2 sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0d100d] px-5 py-5 sm:hidden">
            <div className="flex flex-col gap-4">
              <a href="#features" onClick={closeMenu}>
                Features
              </a>
              <a href="#pages" onClick={closeMenu}>
                Explore pages
              </a>
              <a href="#how-it-works" onClick={closeMenu}>
                How it works
              </a>
              <Link to="/contact" onClick={closeMenu}>
                Contact
              </Link>

              <div className="flex gap-3 border-t border-white/10 pt-4">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-full border border-white/15 py-3 text-center text-sm font-bold"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-full bg-[#a3ff6b] py-3 text-center text-sm font-bold text-black"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section className="relative">
          <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#a3ff6b]/10 blur-[130px]" />
          <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#a3ff6b]/5 blur-[130px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#a3ff6b]/20 bg-[#a3ff6b]/[0.07] px-4 py-2 text-xs font-bold tracking-wider text-[#b7ff91]">
                <Zap size={15} />
                YOUR FITNESS JOURNEY, ORGANIZED
              </div>

              <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Build healthier habits.
                <span className="mt-2 block text-[#a3ff6b]">
                  Track every step.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
                WEHEALTHY brings workouts, nutrition, personal goals and
                progress tracking together in one fitness platform. Create
                your account and make your fitness journey easier to manage.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#a3ff6b] px-7 py-4 font-bold text-black transition hover:-translate-y-0.5 hover:bg-[#b7ff91]"
                >
                  Start your journey
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href="#pages"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 font-semibold transition hover:border-[#a3ff6b]/60 hover:text-[#a3ff6b]"
                >
                  Explore features
                  <ChevronRight size={17} />
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/65">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-[#a3ff6b]" />
                  Workout tracking
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-[#a3ff6b]" />
                  Nutrition records
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-[#a3ff6b]" />
                  Personal progress
                </span>
              </div>
            </div>

            {/* HERO IMAGE AND FEATURE PREVIEW */}
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#a3ff6b]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#141814] p-3 shadow-2xl">
                <div
                  className="relative flex min-h-[430px] flex-col justify-between overflow-hidden rounded-[1.5rem] bg-cover bg-center p-6 sm:min-h-[510px] sm:p-8"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, rgba(5,8,5,0.05) 0%, rgba(5,8,5,0.3) 40%, rgba(5,8,5,0.96) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1100&q=85')",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-[0.2em] text-[#a3ff6b]">
                        WEHEALTHY 2.0
                      </p>
                      <p className="mt-2 text-sm text-white/75">
                        Your fitness space
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a3ff6b] text-black">
                      <Dumbbell size={24} />
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs text-white/80 backdrop-blur">
                      <Activity size={14} className="text-[#a3ff6b]" />
                      TRAIN. FUEL. PROGRESS.
                    </span>

                    <h2 className="mt-5 max-w-md text-4xl font-black leading-tight sm:text-5xl">
                      Your goals.
                      <span className="block text-[#a3ff6b]">
                        Your progress.
                      </span>
                    </h2>

                    <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
                      Plan your workouts, record your nutrition and keep your
                      fitness journey moving forward.
                    </p>

                    <Link
                      to="/register"
                      className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 font-bold text-black transition hover:bg-[#a3ff6b]"
                    >
                      Get started <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171b16] p-4 shadow-xl sm:-left-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#a3ff6b]/15 text-[#a3ff6b]">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold">Your personal account</p>
                  <p className="mt-1 text-xs text-white/50">
                    Keep your records connected
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WEBSITE OVERVIEW */}
        <section className="border-y border-white/[0.08] bg-[#0e110e]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#a3ff6b]/10 text-[#a3ff6b]">
                  <Dumbbell size={23} />
                </div>
                <div>
                  <h3 className="font-bold">Training</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Exercise categories, workout sessions and timers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#a3ff6b]/10 text-[#a3ff6b]">
                  <Utensils size={23} />
                </div>
                <div>
                  <h3 className="font-bold">Nutrition</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Daily calories, macronutrients and water intake.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#a3ff6b]/10 text-[#a3ff6b]">
                  <BarChart3 size={23} />
                </div>
                <div>
                  <h3 className="font-bold">Progress</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Weight records, measurements and fitness history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-[#a3ff6b]">
              WHAT WEHEALTHY OFFERS
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              Everything organized around your fitness journey.
            </h2>
            <p className="mt-5 leading-7 text-white/55">
              Use dedicated pages for your workouts, nutrition and personal
              progress instead of keeping your fitness records scattered.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="group rounded-3xl border border-white/10 bg-[#111411] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#a3ff6b]/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a3ff6b]/10 text-[#a3ff6b] transition group-hover:bg-[#a3ff6b] group-hover:text-black">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* PAGE DIRECTORY */}

        {/* BEFORE LOGIN / AFTER LOGIN */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-[#a3ff6b]">
              SIMPLE TO GET STARTED
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              From exploring to tracking.
            </h2>
            <p className="mt-5 leading-7 text-white/55">
              Explore the platform first, then sign in to use your personal
              fitness tools.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#111411] p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-white/40">
                    BEFORE LOGIN
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Explore WEHEALTHY</h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/55">
                Discover the website, learn about the available tools and
                decide how you want to organize your fitness journey.
              </p>

              <ul className="mt-6 space-y-4">
                {beforeLogin.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#a3ff6b]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 font-bold text-[#a3ff6b] hover:gap-3"
              >
                Sign in <ArrowRight size={17} />
              </Link>
            </div>

            <div className="rounded-3xl border border-[#a3ff6b]/25 bg-[#a3ff6b]/[0.045] p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#a3ff6b]/15 text-[#a3ff6b]">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-[#a3ff6b]">
                    AFTER LOGIN
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Your personal space</h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/55">
                Sign in to access your account, use the fitness tools and
                manage the records associated with your profile.
              </p>

              <ul className="mt-6 space-y-4">
                {afterLogin.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#a3ff6b]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#a3ff6b] px-5 py-3 font-bold text-black transition hover:bg-[#b7ff91]"
              >
                Create your account <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#a3ff6b]/20 bg-[#111711] p-8 sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#a3ff6b]/10 blur-[90px]" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div>
                <p className="mb-4 text-xs font-bold tracking-[0.25em] text-[#a3ff6b]">
                  YOUR NEXT STEP STARTS HERE
                </p>
                <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Ready to take control of your fitness journey?
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-white/55">
                  Create your WEHEALTHY account to get started with your
                  personal workouts, nutrition tracking and fitness records.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#a3ff6b] px-7 py-4 font-bold text-black transition hover:bg-[#b7ff91]"
                >
                  Get started <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 font-bold transition hover:border-[#a3ff6b]/50"
                >
                  Already a member?
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#090b09]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="inline-flex items-center gap-2">
                <Activity size={23} className="text-[#a3ff6b]" />
                <span className="font-black tracking-tight">
                  WE<span className="text-[#a3ff6b]">HEALTHY</span>
                  <span className="ml-1 text-xs text-white/40">2.0</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/45">
                A place to organize your workouts, nutrition and fitness
                progress.
              </p>
            </div>

            <div>
              <h3 className="font-bold">Explore</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/50">
                <a href="#features" className="hover:text-[#a3ff6b]">Features</a>
                <a href="#pages" className="hover:text-[#a3ff6b]">Website pages</a>
                <a href="#how-it-works" className="hover:text-[#a3ff6b]">How it works</a>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Your account</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/50">
                <Link to="/login" className="hover:text-[#a3ff6b]">Log in</Link>
                <Link to="/register" className="hover:text-[#a3ff6b]">Create account</Link>
                <Link to="/dashboard" className="hover:text-[#a3ff6b]">Dashboard</Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Pages</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/50">
                <Link to="/training" className="hover:text-[#a3ff6b]">Training</Link>
                <Link to="/nutrition" className="hover:text-[#a3ff6b]">Nutrition</Link>
                <Link to="/progress" className="hover:text-[#a3ff6b]">Progress</Link>
                <Link to="/contact" className="hover:text-[#a3ff6b]">Contact</Link>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} WEHEALTHY 2.0. All rights reserved.</p>
            <p>Build healthy habits. Keep moving forward.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}