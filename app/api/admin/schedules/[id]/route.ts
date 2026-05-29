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
    
    // Physical delete
    await prisma.schedule.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true, message: "Jadwal berhasil dihapus secara permanen" });
  } catch (error: any) {
    console.error("Delete schedule error:", error);
    if (error.code === 'P2003' || (error.message && error.message.includes("Foreign key constraint"))) {
      return NextResponse.json(
        { error: "Jadwal tidak dapat dihapus secara permanen karena sudah memiliki transaksi/booking aktif." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 });
  }
}
