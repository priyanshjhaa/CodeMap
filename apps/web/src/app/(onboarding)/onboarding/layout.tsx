import { redirect } from "next/navigation";
import { OnboardingChrome } from "../../../components/onboarding-chrome";
import { auth } from "../../../lib/auth";
import "../../onboarding.css";

export default async function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <OnboardingChrome>{children}</OnboardingChrome>;
}
