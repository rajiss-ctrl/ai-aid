// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    niche: "default", // ✅ Add niche field
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const niches = [
    { 
      value: "default", 
      label: "General Assistant", 
      icon: "◎", 
      description: "General purpose AI assistant for everyday tasks"
    },
    { 
      value: "law", 
      label: "Legal Assistant", 
      icon: "⚖️", 
      description: "Specialized in legal research, contract analysis, and case law"
    },
    { 
      value: "business", 
      label: "Business Strategy", 
      icon: "◈", 
      description: "Focuses on growth strategies, operations, and financial planning"
    },
    { 
      value: "medical", 
      label: "Medical Information", 
      icon: "⚕️", 
      description: "Medical knowledge and healthcare information (educational only)"
    },
  ];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/login?registered=true");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Start your free AI workspace today
          </p>
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
              Your name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
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
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization name
            </label>
            <input
              name="orgName"
              type="text"
              value={form.orgName}
              onChange={handleChange}
              placeholder="Acme Inc."
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ Niche Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Your AI Assistant Niche
            </label>
            <div className="grid grid-cols-1 gap-3">
              {niches.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, niche: option.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.niche === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-semibold text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-9">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 
                       text-white font-medium py-2.5 rounded-lg text-sm 
                       transition-colors cursor-pointer"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}