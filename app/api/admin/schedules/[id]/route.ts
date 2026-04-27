import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { price, isActive, departureTime, vehicleType } = body;

    const schedule = await prisma.schedule.update({
      where: { id: resolvedParams.id },
      data: {
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive }),
        ...(departureTime !== undefined && { departureTime: new Date(departureTime) }),
        ...(vehicleType !== undefined && { vehicleType }),
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json({ error: "Gagal mengupdate jadwal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    
    // Soft delete
    const schedule = await prisma.schedule.update({
      where: { id: resolvedParams.id },
      data: { isDeleted: true, isActive: false },
    });

    return NextResponse.json({ success: true, message: "Jadwal berhasil dihapus (soft delete)" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 });
  }
}
