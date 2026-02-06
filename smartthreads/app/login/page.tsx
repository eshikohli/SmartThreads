"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", { email, callbackUrl: "/threads" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
        >
          Continue with Email
        </button>
      </form>
    </div>
  );
}
