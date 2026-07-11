import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const fieldClass =
  "w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-ink";
const labelClass =
  "mb-2 block font-space text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signup(email, username, password, name);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 font-rubik text-ink">
      <div className="w-full max-w-sm">
        <header className="mb-10 text-center">
          <h1 className="font-space text-3xl font-bold uppercase tracking-tighter">Halftone</h1>
          <p className="mt-2 font-space text-[10px] uppercase tracking-[0.25em] text-ink/40">
            Register for the print run
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 border border-ink/10 p-8">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${fieldClass} font-space`}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>
              Display Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="font-space text-[10px] uppercase tracking-widest text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full bg-ink py-2 font-space text-[11px] font-bold uppercase tracking-widest text-paper transition-colors hover:bg-ink-muted disabled:opacity-50"
          >
            {submitting ? "Registering…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center font-space text-[11px] text-ink/50">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
