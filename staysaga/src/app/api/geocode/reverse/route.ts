import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  try {
    // 1. Try Nominatim reverse
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "StaySagaPropertyWizard/1.0",
        "Accept-Language": "vi,en;q=0.9",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        let streetAddr =
          addr.amenity ||
          addr.building ||
          addr.house_number ||
          addr.road ||
          data.name ||
          "Đường không tên";
        if (addr.house_number && addr.road) {
          streetAddr = `${addr.house_number} ${addr.road}`;
        }

        let city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
        if (city) {
          city = city.replace(/^(Thành phố|Huyện|Thị xã)\s+/i, "");
        }

        let district = addr.suburb || addr.quarter || addr.district || "";
        if (district) {
          district = district.replace(/^(Phường|Xã|Thị trấn)\s+/i, "");
        }

        return NextResponse.json({
          address: data.display_name,
          city,
          district,
          country: addr.country || "",
          provider: "nominatim",
        });
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse failed, trying Photon:", err);
  }

  // 2. Fallback to Photon reverse
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;

        let streetAddr = [props.housenumber, props.street].filter(Boolean).join(" ");
        if (!streetAddr && props.name) {
          streetAddr = props.name;
        }
        if (!streetAddr) {
          streetAddr = "Đường không tên";
        }

        const city = props.city || props.county || "";
        const district = props.district || props.locality || props.county || "";
        const fullAddress = [streetAddr, district, city, props.state, props.country]
          .filter(Boolean)
          .join(", ");

        return NextResponse.json({
          address: fullAddress,
          city,
          district,
          country: props.country || "",
          provider: "photon",
        });
      }
    }
  } catch (err) {
    console.error("Photon reverse failed:", err);
  }

  return NextResponse.json({ error: "Unable to reverse geocode" }, { status: 500 });
}
