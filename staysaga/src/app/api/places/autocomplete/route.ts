import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { predictions: [], error: "MISSING_API_KEY" },
      { status: 400 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${apiKey}&language=vi&components=country:vn`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ predictions: [], error: "API_ERROR" }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Maps Autocomplete Error:", error);
    return NextResponse.json({ predictions: [], error: "SERVER_ERROR" }, { status: 500 });
  }
}
