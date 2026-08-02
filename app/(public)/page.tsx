import { Header } from "@/components/public/Header";
import { MenuClient } from "@/components/public/MenuClient";
import { PromoBanner } from "@/components/public/PromoBanner";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Neighborhood,
  Product,
  ProductSize,
  StoreSettings,
} from "@/lib/types";

const FALLBACK_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "Esquina Pasteburguer",
  whatsapp_number: "",
  opening_hours: "",
  is_open: false,
  min_order_value: 0,
  estimated_delivery_time: "",
  logo_url: null,
  banner_url: null,
  promo_text: null,
  updated_at: new Date().toISOString(),
};

export default async function Home() {
  const isSupabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-ink/10">
          <p className="text-sm font-semibold text-ink">
            Configuração pendente
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Defina <code className="text-brand">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            e{" "}
            <code className="text-brand">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            em <code>.env.local</code> para carregar o cardápio.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const [
    settingsResult,
    categoriesResult,
    productsResult,
    neighborhoodsResult,
    productSizesResult,
  ] = await Promise.all([
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("neighborhoods")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true }),
    supabase
      .from("product_sizes")
      .select("*")
      .order("position", { ascending: true }),
  ]);

  if (
    categoriesResult.error ||
    productsResult.error ||
    neighborhoodsResult.error ||
    productSizesResult.error
  ) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="max-w-sm text-center text-sm text-brand">
          Não foi possível carregar o cardápio agora. Tente novamente em
          instantes.
        </p>
      </main>
    );
  }

  const settings: StoreSettings = settingsResult.data ?? FALLBACK_SETTINGS;
  const categories: Category[] = categoriesResult.data ?? [];
  const products: Product[] = productsResult.data ?? [];
  const neighborhoods: Neighborhood[] = neighborhoodsResult.data ?? [];
  const productSizes: ProductSize[] = productSizesResult.data ?? [];

  const sizesByProduct: Record<string, ProductSize[]> = {};
  for (const size of productSizes) {
    (sizesByProduct[size.product_id] ??= []).push(size);
  }

  return (
    <main className="flex flex-1 flex-col">
      <Header settings={settings} />
      <PromoBanner text={settings.promo_text} />
      <MenuClient
        categories={categories}
        products={products}
        sizesByProduct={sizesByProduct}
        neighborhoods={neighborhoods}
        whatsappNumber={settings.whatsapp_number}
      />
    </main>
  );
}
