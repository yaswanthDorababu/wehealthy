import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";

const experts = [
  {
    name: "Fitness Coaching",
    role: "Training guidance",
    description: "Get help building a workout routine that fits your experience, goals, and schedule.",
    icon: Dumbbell,
    tag: "TRAINING",
  },
  {
    name: "Nutrition Guidance",
    role: "Healthy eating support",
    description: "Ask questions about meal planning, food choices, and building sustainable habits.",
    icon: Utensils,
    tag: "NUTRITION",
  },
  {
    name: "General Support",
    role: "WEHEALTHY assistance",
    description: "Need help using your account or tracking your progress? Send our team a message.",
    icon: MessageCircle,
    tag: "SUPPORT",
  },
];

const initialForm = {
  name: "",
  email: "",
  topic: "Fitness coaching",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [sentMessage, setSentMessage] = useState("");

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setSentMessage("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setSentMessage("Please complete all fields before sending your message.");
      return;
    }

    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailLooksValid) {
      setSentMessage("Please enter a valid email address.");
      return;
    }

    const subject = encodeURIComponent(`[WEHEALTHY] ${form.topic}: ${form.subject}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nTopic: ${form.topic}\n\n${form.message}`
    );

    setSentMessage("Your email app should open with your message prepared. Sending is not connected to a server yet.");
    window.location.href = `mailto:support@wehealthy.example?subject=${subject}&body=${body}`;
  };

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
              <p className="text-[10px] tracking-[0.25em] text-gray-500">CONTACT & SUPPORT</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-gray-400 md:flex">
            <Link to="/" className="hover:text-lime-400">Home</Link>
            <Link to="/training" className="hover:text-lime-400">Training</Link>
            <Link to="/nutrition" className="hover:text-lime-400">Nutrition</Link>
            <Link to="/progress" className="hover:text-lime-400">Progress</Link>
            <span className="font-semibold text-lime-400">Contact</span>
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

      <main className="mx-auto max-w-7xl space-y-10 px-5 py-8 lg:px-8 lg:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#26301a] via-[#151a14] to-[#101210] p-7 md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-300">
              <MessageCircle size={15} /> WE'RE HERE TO HELP
            </span>
            <h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
              Your goals.
              <br />
              <span className="text-lime-400">Our support.</span>
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-gray-400">
              Have a question about training, nutrition, or your WEHEALTHY account?
              Send a message and let us know what you need help with.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {experts.map((expert) => {
            const Icon = expert.icon;
            return (
              <article key={expert.name} className="rounded-2xl border border-white/10 bg-[#111411] p-6 transition hover:border-lime-400/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400">
                    <Icon size={24} />
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-gray-400">{expert.tag}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{expert.name}</h3>
                <p className="mt-1 text-sm text-lime-300">{expert.role}</p>
                <p className="mt-3 text-sm leading-6 text-gray-500">{expert.description}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="space-y-5">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-lime-400">GET IN TOUCH</p>
              <h2 className="mt-2 text-2xl font-black">Let's talk</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Share a little detail about what you need. This contact form currently prepares an email on your device; it does not store or send messages through a backend yet.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111411] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400"><Mail size={21} /></div>
                <div>
                  <p className="text-sm font-semibold">Email support</p>
                  <p className="mt-1 text-xs text-gray-500">Set your real support email before launch</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Clock3 size={21} /></div>
                <div>
                  <p className="text-sm font-semibold">Response time</p>
                  <p className="mt-1 text-xs text-gray-500">Response times depend on your support setup</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300"><ShieldCheck size={21} /></div>
                <div>
                  <p className="text-sm font-semibold">Your information</p>
                  <p className="mt-1 text-xs text-gray-500">Avoid sharing passwords or sensitive personal details</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-5">
              <div className="flex items-center gap-2 text-lime-300">
                <CheckCircle2 size={19} />
                <p className="font-semibold">Helpful tip</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                For faster support, choose the closest topic and describe what you were trying to do, including any error message you saw.
              </p>
            </div>
          </aside>

          <div className="rounded-2xl border border-white/10 bg-[#111411] p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black">Send us a message</h2>
              <p className="mt-2 text-sm text-gray-500">Fields marked with * are required.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-gray-400">
                  Your name *
                  <span className="relative mt-2 block">
                    <UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      required
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none placeholder:text-gray-600 focus:border-lime-400"
                    />
                  </span>
                </label>
                <label className="block text-sm text-gray-400">
                  Email address *
                  <span className="relative mt-2 block">
                    <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none placeholder:text-gray-600 focus:border-lime-400"
                    />
                  </span>
                </label>
              </div>

              <label className="block text-sm text-gray-400">
                What can we help with? *
                <select
                  value={form.topic}
                  onChange={(event) => updateField("topic", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#171b16] px-4 py-3 text-white outline-none focus:border-lime-400"
                >
                  <option>Fitness coaching</option>
                  <option>Nutrition guidance</option>
                  <option>Account support</option>
                  <option>Bug report</option>
                  <option>Feedback or suggestion</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="block text-sm text-gray-400">
                Subject *
                <input
                  required
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  placeholder="Briefly describe your question"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-lime-400"
                />
              </label>

              <label className="block text-sm text-gray-400">
                Message *
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Tell us how we can help..."
                  className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-lime-400"
                />
              </label>

              {sentMessage && (
                <p role="status" className="rounded-xl border border-lime-400/20 bg-lime-400/5 px-4 py-3 text-sm text-lime-200">
                  {sentMessage}
                </p>
              )}

              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 font-bold text-black transition hover:bg-lime-300">
                <Send size={18} /> Prepare email <ArrowRight size={17} />
              </button>
              <p className="text-xs leading-5 text-gray-600">
                This demo uses your device's default email app. Replace the placeholder support address in the code and connect a secure backend before production use.
              </p>
            </form>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 WEHEALTHY. Build healthy habits every day.</p>
          <Link to="/dashboard" className="flex items-center gap-2 text-lime-400 hover:text-lime-300">Back to Dashboard <ArrowRight size={15} /></Link>
        </footer>
      </main>
    </div>
  );
}
