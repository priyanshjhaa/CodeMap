import { ProductProvider } from "../../../components/product-provider";
import { ProductShell } from "../../../components/product-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductProvider>
      <ProductShell>{children}</ProductShell>
    </ProductProvider>
  );
}
