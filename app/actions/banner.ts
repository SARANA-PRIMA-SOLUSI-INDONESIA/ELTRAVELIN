"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export async function updateBanner(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  const file = formData.get("imageFile") as File | null;
  let imageUrl = formData.get("imageUrl") as string;

  // Handle file upload if a new file is provided
  if (file && file.size > 0) {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Define storage path
      const uploadDir = path.join(process.cwd(), "public", "banners");
      
      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Create unique filename
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = path.join(uploadDir, filename);

      // Write file
      await fs.writeFile(filePath, buffer);
      
      // Update the URL to the local public path
      imageUrl = `/banners/${filename}`;
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
