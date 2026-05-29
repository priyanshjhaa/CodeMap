"use server";

import { signIn, signOut } from "./auth";

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/onboarding/workspace" });
}

export async function signOutFromCodeMap() {
  await signOut({ redirectTo: "/login" });
}
