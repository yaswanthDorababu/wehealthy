
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Activity, Eye, EyeOff, LoaderCircle } from "lucide-react";

type AuthProps = {
  mode: "login" | "register";
};

export default function Auth({ mode }: AuthProps) {
  const navigate = useNavigate();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setLoading(true);
  setMessage("");
  setError("");

  try {
    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setMessage(
          "Account created. Please check your email for a confirmation link before signing in."
        );
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              full_name: name.trim(),
              email: email.trim(),
            },
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("Profile save error:", profileError);
        }
      }

      navigate("/dashboard", { replace: true });
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setMessage("Login succeeded, but no active session was returned.");
        return;
      }

      navigate("/dashboard", { replace: true });
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090b09] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121612] p-7 shadow-2xl sm:p-9">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300 text-black">
            <Activity size={25} />
          </span>

          <span className="text-xl font-black tracking-wide">
            WEHEALTHY<span className="text-lime-300">.</span>
          </span>
        </Link>

        <h1 className="text-3xl font-bold">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mb-7 mt-2 text-sm text-gray-400">
          {isRegister
            ? "Start building healthier habits today."
            : "Sign in to continue your fitness journey."}
        </p>

        {message && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-lime-300/10 p-3 text-sm text-lime-300"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm text-gray-300"
              >
                Full name
              </label>

              <input
                id="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-lime-300"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-gray-300"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-lime-300"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-gray-300"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  isRegister ? "new-password" : "current-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 outline-none focus:border-lime-300"
              />

              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 py-3.5 font-bold text-black transition hover:bg-lime-200 disabled:opacity-60"
          >
            {loading && (
              <LoaderCircle className="animate-spin" size={19} />
            )}

            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isRegister ? "Already have an account?" : "New to WEHEALTHY?"}{" "}
          <Link
            to={isRegister ? "/login" : "/register"}
            className="font-semibold text-lime-300 hover:underline"
          >
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>

        <Link
          to="/"
          className="mt-5 block text-center text-sm text-gray-500 hover:text-white"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}