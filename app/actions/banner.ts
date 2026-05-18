"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

export async function updateBanner(formData: FormData) {
  try {
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
          // Convert to buffer to ensure complete compatibility in Vercel Serverless environment
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const blob = await put(filename, buffer, { 
            access: "public", 
            token: token,
            contentType: file.type, // Explicitly pass content type
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
      } catch (uploadError: any) {
        console.error("Error saving file in Server Action:", uploadError);
        return { 
          success: false, 
          error: `Gagal mengunggah gambar: ${uploadError.message || uploadError}` 
        };
      }
    }

    // Update or Create in DB
    try {
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
    } catch (dbError: any) {
      console.error("Database error in Server Action:", dbError);
      return { 
        success: false, 
        error: `Gagal menyimpan ke database: ${dbError.message || dbError}` 
      };
    }

    revalidatePath("/");
    revalidatePath("/admin/master/banner");

    return { success: true };
  } catch (err: any) {
    console.error("Unhandled error in updateBanner:", err);
    return { 
      success: false, 
      error: `Terjadi kesalahan internal: ${err.message || err}` 
    };
  }
}
