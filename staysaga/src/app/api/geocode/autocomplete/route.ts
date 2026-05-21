import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    // 1. Try Nominatim search for highly accurate structures
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&limit=8&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "StaySagaPropertyWizard/1.0",
        "Accept-Language": "vi,en;q=0.9",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const suggestions = data.map((item: any) => {
          const addr = item.address || {};
          const title =
            item.name ||
            addr.amenity ||
            addr.tourism ||
            addr.shop ||
            addr.office ||
            addr.building ||
            [addr.house_number, addr.road].filter(Boolean).join(" ") ||
            addr.road ||
            item.display_name.split(",")[0];

          let city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
          if (city) {
            city = city.replace(/^(Thành phố|Huyện|Thị xã)\s+/i, "");
          }

          let district = addr.suburb || addr.quarter || addr.district || "";
          if (district) {
            district = district.replace(/^(Phường|Xã|Thị trấn)\s+/i, "");
          }

          return {
            title: String(title),
            subtitle: [district, city, addr.state, addr.country].filter(Boolean).join(", "),
            fullAddress: String(item.display_name),
            city: city || "",
            district: district || "",
            country: addr.country || "",
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            provider: "nominatim",
          };
        });
        return NextResponse.json(suggestions);
      }
    }
  } catch (err) {
    console.warn("Nominatim autocomplete failed, falling back to Photon:", err);
  }

  // 2. Fallback to Photon
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      const suggestions = (data.features || []).map((feature: any) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        let title = props.name;
        if (!title) {
          title = [props.housenumber, props.street].filter(Boolean).join(" ");
        }
        if (!title) {
          title = props.city || props.state || props.country || "Địa điểm không tên";
        }

        const subParts: string[] = [];
        if (props.street && props.name && props.name !== props.street) {
          subParts.push(props.street);
        }
        if (props.district) subParts.push(props.district);
        if (props.city) subParts.push(props.city);
        if (props.state && props.state !== props.city) subParts.push(props.state);

        return {
          title: String(title),
          subtitle: subParts.join(", "),
          fullAddress: [title, subParts.join(", ")].filter(Boolean).join(", "),
          city: props.city || props.county || "",
          district: props.district || "",
          country: props.country || "",
          lat: coords[1],
          lon: coords[0],
          provider: "photon",
        };
      });
      return NextResponse.json(suggestions);
    }
  } catch (err) {
    console.error("Photon autocomplete failed:", err);
  }

  return NextResponse.json([]);
}
