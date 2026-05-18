"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

export async function updateBanner(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  const file = formData.get("imageFile") as File | null;
  let imageUrl = formData.get("imageUrl") as string;
  const token = process.env.BLOB_EL_TRAVELIN_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

  if (file && file.size > 0) {
    try {
      if (token) {
        // Use Vercel Blob with custom token passed explicitly
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const blob = await put(filename, file, { 
          access: "public", 
          token: token 
        });
        imageUrl = blob.url;
      } else {
        // Fallback to base64 database storage if no token is configured
        console.warn("No Vercel Blob token configured. Falling back to base64 database storage.");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");
        imageUrl = `data:${file.type};base64,${base64Data}`;
      }
    } catch (error) {
      console.error("Error saving file:", error);
      throw new Error("Gagal menyimpan file gambar.");
    }
  }

  // Update or Create in DB
  if (id && id !== "undefined" && id !== "") {
    await prisma.banner.update({
      where: { id },
      data: {
        imageUrl,
        isActive,
        title: "Promo Banner",
      },
    });
  } else {
    await prisma.banner.create({
      data: {
        title: "Promo Banner",
        imageUrl,
        isActive,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/master/banner");
}
