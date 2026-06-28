"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard/chat");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI SaaS Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 
                          text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 
                       text-white font-medium py-2.5 rounded-lg text-sm 
                       transition-colors cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline font-medium">
            Create one
          </a>
        </p>

      </div>
    </div>
  );
}
