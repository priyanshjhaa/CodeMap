import { redirect } from "next/navigation";
import { ProductProvider } from "../../../components/product-provider";
import { ProductShell } from "../../../components/product-shell";
import { auth } from "../../../lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ProductProvider>
      <ProductShell>{children}</ProductShell>
    </ProductProvider>
  );
}
