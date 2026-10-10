import { NextResponse } from "next/server";

// ponytail: Nominatim free tier; swap to Google/Mapbox if quota/accuracy becomes an issue.
const NOMINATIM = "https://nominatim.openstreetmap.org";
const UA = "ElTravelin/1.0 (pickup-geocode; https://eltravel.in)";

type NominatimItem = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    if (q) {
      if (q.length < 3) {
        return NextResponse.json({ results: [] });
      }
      const params = new URLSearchParams({
        q,
        format: "json",
        addressdetails: "0",
        limit: "5",
        countrycodes: "id",
      });
      const nearLat = searchParams.get("nearLat");
      const nearLng = searchParams.get("nearLng");
      if (nearLat && nearLng) {
        const la = Number(nearLat);
        const ln = Number(nearLng);
        if (Number.isFinite(la) && Number.isFinite(ln)) {
          // Bias results near pool (~±0.25° ≈ 25 km)
          params.set("viewbox", `${ln - 0.25},${la + 0.25},${ln + 0.25},${la - 0.25}`);
          params.set("bounded", "0");
        }
      }
      const res = await fetch(`${NOMINATIM}/search?${params}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Pencarian alamat gagal." }, { status: 502 });
      }
      const data = (await res.json()) as NominatimItem[];
      return NextResponse.json({
        results: data.map((item) => ({
          lat: Number(item.lat),
          lng: Number(item.lon),
          label: item.display_name,
        })),
      });
    }

    if (lat != null && lng != null) {
      const params = new URLSearchParams({
        lat,
        lon: lng,
        format: "json",
        addressdetails: "0",
        zoom: "18",
      });
      const res = await fetch(`${NOMINATIM}/reverse?${params}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Gagal mendeteksi alamat." }, { status: 502 });
      }
      const data = (await res.json()) as { display_name?: string };
      return NextResponse.json({ label: data.display_name || null });
    }

    return NextResponse.json({ error: "Parameter q atau lat/lng wajib." }, { status: 400 });
  } catch (error) {
    console.error("[geocode]", error);
    return NextResponse.json({ error: "Layanan geocode tidak tersedia." }, { status: 502 });
  }
}
