"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type ActionResult = { error?: string } | undefined;

const IMAGE_URL_MARKER = "/object/public/products/";

async function uploadProductImage(
  supabase: SupabaseClient<Database>,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

async function removeProductImage(
  supabase: SupabaseClient<Database>,
  imageUrl: string | null
) {
  if (!imageUrl) return;
  const index = imageUrl.indexOf(IMAGE_URL_MARKER);
  if (index === -1) return;
  const path = imageUrl.slice(index + IMAGE_URL_MARKER.length);
  await supabase.storage.from("products").remove([path]);
}

interface ProductFields {
  name: string;
  category_id: string;
  description: string | null;
  price: number;
  promo_price: number | null;
  available: boolean;
  featured: boolean;
}

function parseFields(formData: FormData): ProductFields | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const promoRaw = String(formData.get("promo_price") ?? "").trim();
  const promoPrice = promoRaw ? Number(promoRaw) : null;
  const available = formData.get("available") === "on";
  const featured = formData.get("featured") === "on";

  if (!name) return { error: "Nome é obrigatório" };
  if (!categoryId) return { error: "Selecione uma categoria" };
  if (!price || Number.isNaN(price) || price <= 0) {
    return { error: "Informe um preço válido" };
  }
  if (promoPrice !== null && (Number.isNaN(promoPrice) || promoPrice >= price)) {
    return { error: "O preço promocional deve ser menor que o preço normal" };
  }

  return {
    name,
    category_id: categoryId,
    description: description || null,
    price,
    promo_price: promoPrice,
    available,
    featured,
  };
}

export async function createProduct(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const fields = parseFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createClient();
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadProductImage(supabase, imageFile);
    } catch {
      return { error: "Falha ao enviar a imagem" };
    }
  }

  const { data: last } = await supabase
    .from("products")
    .select("position")
    .eq("category_id", fields.category_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("products").insert({
    ...fields,
    image_url: imageUrl,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

export async function updateProduct(
  id: string,
  currentImageUrl: string | null,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const fields = parseFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createClient();
  const imageFile = formData.get("image") as File | null;

  let imageUrl = currentImageUrl;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadProductImage(supabase, imageFile);
      await removeProductImage(supabase, currentImageUrl);
    } catch {
      return { error: "Falha ao enviar a imagem" };
    }
  }

  const { error } = await supabase
    .from("products")
    .update({ ...fields, image_url: imageUrl })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

export async function deleteProduct(
  id: string,
  imageUrl: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };

  await removeProductImage(supabase, imageUrl);

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

export async function toggleProductField(
  id: string,
  field: "available" | "featured",
  value: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const update = field === "available" ? { available: value } : { featured: value };
  const { error } = await supabase.from("products").update(update).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}
