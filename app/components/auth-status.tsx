"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {!isLoading && (
            <button
              onClick={() => signIn()}
              className="rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 transition-all transform hover:scale-105"
              style={{ boxShadow: "0 4px 10px rgba(0, 180, 216, 0.3)" }}
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </div>
  );
}
