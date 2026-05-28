import { AuthCard } from "../../components/auth-card";

export default function LoginPage() {
  const githubEnabled = Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET
  );

  return (
    <main className="auth-shell">
      <AuthCard githubEnabled={githubEnabled} />
    </main>
  );
}
