"use server";

import { signIn, signOut } from "./auth";

export async function signInWithGitHub() {
  await signIn(
    "github",
    { redirectTo: "/onboarding/workspace" },
    {
      prompt: "consent",
      scope: "repo read:org user:email",
      allow_signup: "true"
    }
  );
}

export async function signOutFromCodeMap() {
  await signOut({ redirectTo: "/" });
}
