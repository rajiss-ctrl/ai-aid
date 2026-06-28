"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  _count: { chatMessages: number };
};

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "MEMBER" }),
    });
    const data = await res.json();
    if (data.inviteUrl) {
      setInviteUrl(data.inviteUrl);
      setInviteEmail("");
    }
    setInviting(false);
  }

  if (loading) return (
    <div className="p-8 text-gray-400">Loading...</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Admin Panel
      </h1>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">
            Team members ({members.length})
          </p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Messages"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-medium text-gray-500 text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {m.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {m.email}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.role === "OWNER"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {m._count.chatMessages}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-900 mb-3">
          Invite team member
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={inviting}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {inviting ? "Sending..." : "Invite"}
          </button>
        </form>

        {inviteUrl && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 break-all">
            Invite link: <strong>{inviteUrl}</strong>
          </div>
        )}
      </div>
    </div>
  );
}