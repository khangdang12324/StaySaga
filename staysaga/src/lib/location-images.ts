type LocationImageRecord = {
  label: string;
  images: readonly string[];
  aliases: readonly string[];
};

const unsplashHotel = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?q=80&w=1600&auto=format&fit=crop`;

const HOTEL_POOLS = {
  dalat: [
    "/hotels/dalat/810886880.webp",
    "/hotels/dalat/845558402.webp",
    "/hotels/dalat/535449758.webp",
    "/hotels/dalat/353707825.webp",
    "/hotels/dalat/358852760.webp",
    "/hotels/dalat/185191579.webp",
  ],
  urban: [
    unsplashHotel("photo-1566073771259-6a8506099945"),
    unsplashHotel("photo-1551882547-ff40c63fe5fa"),
    unsplashHotel("photo-1564501049412-61c2a3083791"),
  ],
  coastal: [
    unsplashHotel("photo-1582719508461-905c673771fd"),
    unsplashHotel("photo-1520250497591-112f2f40a3f4"),
    unsplashHotel("photo-1571896349842-33c89424de2d"),
  ],
  homestay: [
    unsplashHotel("photo-1505693416388-ac5ce068fe85"),
    unsplashHotel("photo-1484154218962-a197022b5858"),
    unsplashHotel("photo-1502672260266-1c1e525044c7"),
  ],
  mountain: [
    unsplashHotel("photo-1518780664697-55e3ad937233"),
    unsplashHotel("photo-1523217582562-09d0def993a6"),
    unsplashHotel("photo-1600585154340-be6161a56a0c"),
  ],
  boutique: [
    unsplashHotel("photo-1540518614846-7eded433c457"),
    unsplashHotel("photo-1618221195710-dd6b41faaea6"),
    unsplashHotel("photo-1560185007-c5ca9d2c014d"),
  ],
} as const;

export const normalizeLocation = (location?: string | null) => {
  if (!location) return "";

  return location
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[.,/\\()[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const vietnamLocationRecords = {
  "da-lat": {
    label: "Đà Lạt",
    images: HOTEL_POOLS.dalat,
    aliases: ["Đà Lạt", "Dalat", "Da Lat", "Lâm Đồng", "Lam Dong"],
  },
  "da-nang": {
    label: "Đà Nẵng",
    images: HOTEL_POOLS.coastal,
    aliases: ["Đà Nẵng", "Da Nang", "Danang"],
  },
  "ha-noi": {
    label: "Hà Nội",
    images: HOTEL_POOLS.urban,
    aliases: ["Hà Nội", "Ha Noi", "Hanoi"],
  },
  "ho-chi-minh": {
    label: "TP. Hồ Chí Minh",
    images: HOTEL_POOLS.urban,
    aliases: [
      "TP. Hồ Chí Minh",
      "Thành phố Hồ Chí Minh",
      "Hồ Chí Minh",
      "Sài Gòn",
      "Ho Chi Minh",
      "Ho Chi Minh City",
      "Saigon",
      "HCM",
      "TPHCM",
    ],
  },
  "hoi-an": {
    label: "Hội An",
    images: HOTEL_POOLS.boutique,
    aliases: ["Hội An", "Hoi An", "Quảng Nam", "Quang Nam"],
  },
  "nha-trang": {
    label: "Nha Trang",
    images: HOTEL_POOLS.coastal,
    aliases: ["Nha Trang", "Khánh Hòa", "Khanh Hoa", "Cam Ranh"],
  },
  "phu-quoc": {
    label: "Phú Quốc",
    images: HOTEL_POOLS.coastal,
    aliases: ["Phú Quốc", "Phu Quoc", "Kiên Giang", "Kien Giang"],
  },
  sapa: {
    label: "Sapa",
    images: HOTEL_POOLS.mountain,
    aliases: ["Sapa", "Sa Pa", "Lào Cai", "Lao Cai"],
  },
  hue: {
    label: "Huế",
    images: HOTEL_POOLS.boutique,
    aliases: ["Huế", "Hue", "Thừa Thiên Huế", "Thua Thien Hue"],
  },
  "can-tho": {
    label: "Cần Thơ",
    images: HOTEL_POOLS.homestay,
    aliases: ["Cần Thơ", "Can Tho", "Cái Răng", "Cai Rang"],
  },
  "ha-long": {
    label: "Hạ Long",
    images: HOTEL_POOLS.coastal,
    aliases: [
      "Hạ Long",
      "Ha Long",
      "Quảng Ninh",
      "Quang Ninh",
      "Bãi Cháy",
      "Bai Chay",
    ],
  },
  "ninh-binh": {
    label: "Ninh Bình",
    images: HOTEL_POOLS.homestay,
    aliases: [
      "Ninh Bình",
      "Ninh Binh",
      "Tràng An",
      "Trang An",
      "Tam Cốc",
      "Tam Coc",
    ],
  },
  "vung-tau": {
    label: "Vũng Tàu",
    images: HOTEL_POOLS.coastal,
    aliases: ["Vũng Tàu", "Vung Tau", "Bà Rịa Vũng Tàu", "Ba Ria Vung Tau"],
  },
  "quy-nhon": {
    label: "Quy Nhơn",
    images: HOTEL_POOLS.coastal,
    aliases: ["Quy Nhơn", "Quy Nhon", "Bình Định", "Binh Dinh"],
  },
  "mui-ne": {
    label: "Mũi Né",
    images: HOTEL_POOLS.coastal,
    aliases: [
      "Mũi Né",
      "Mui Ne",
      "Phan Thiết",
      "Phan Thiet",
      "Bình Thuận",
      "Binh Thuan",
    ],
  },
  "ha-giang": {
    label: "Hà Giang",
    images: HOTEL_POOLS.mountain,
    aliases: ["Hà Giang", "Ha Giang", "Đồng Văn", "Dong Van", "Mèo Vạc", "Meo Vac"],
  },
  "cao-bang": {
    label: "Cao Bằng",
    images: HOTEL_POOLS.mountain,
    aliases: ["Cao Bằng", "Cao Bang", "Bản Giốc", "Ban Gioc"],
  },
} as const satisfies Record<string, LocationImageRecord>;

export const cityImages = Object.fromEntries(
  Object.values(vietnamLocationRecords).map((record) => [
    record.label,
    record.images,
  ]),
) as Record<string, readonly string[]>;

export type CityName = keyof typeof cityImages;

const cityAliases = Object.fromEntries(
  Object.entries(vietnamLocationRecords).flatMap(([key, record]) => [
    [normalizeLocation(record.label), key],
    ...record.aliases.map((alias) => [normalizeLocation(alias), key]),
  ]),
) as Record<string, keyof typeof vietnamLocationRecords>;

const regionalFallbacks: Array<{
  key: keyof typeof vietnamLocationRecords;
  aliases: readonly string[];
}> = [
  {
    key: "ha-noi",
    aliases: [
      "Hải Phòng",
      "Hai Phong",
      "Bắc Ninh",
      "Bac Ninh",
      "Hải Dương",
      "Hai Duong",
      "Nam Định",
      "Nam Dinh",
      "Thái Bình",
      "Thai Binh",
      "Vĩnh Phúc",
      "Vinh Phuc",
      "Phú Thọ",
      "Phu Tho",
      "Thái Nguyên",
      "Thai Nguyen",
      "Tuyên Quang",
      "Tuyen Quang",
      "Yên Bái",
      "Yen Bai",
      "Hòa Bình",
      "Hoa Binh",
      "Sơn La",
      "Son La",
      "Điện Biên",
      "Dien Bien",
      "Lai Châu",
      "Lai Chau",
      "Bắc Giang",
      "Bac Giang",
      "Bắc Kạn",
      "Bac Kan",
      "Lạng Sơn",
      "Lang Son",
    ],
  },
  {
    key: "da-nang",
    aliases: [
      "Quảng Bình",
      "Quang Binh",
      "Quảng Trị",
      "Quang Tri",
      "Quảng Ngãi",
      "Quang Ngai",
      "Kon Tum",
      "Gia Lai",
      "Đắk Lắk",
      "Dak Lak",
      "Đắk Nông",
      "Dak Nong",
      "Phú Yên",
      "Phu Yen",
    ],
  },
  {
    key: "ho-chi-minh",
    aliases: [
      "Đồng Nai",
      "Dong Nai",
      "Bình Dương",
      "Binh Duong",
      "Bình Phước",
      "Binh Phuoc",
      "Tây Ninh",
      "Tay Ninh",
      "Long An",
      "Tiền Giang",
      "Tien Giang",
      "Bến Tre",
      "Ben Tre",
      "Trà Vinh",
      "Tra Vinh",
      "Vĩnh Long",
      "Vinh Long",
      "Đồng Tháp",
      "Dong Thap",
      "An Giang",
      "Hậu Giang",
      "Hau Giang",
      "Sóc Trăng",
      "Soc Trang",
      "Bạc Liêu",
      "Bac Lieu",
      "Cà Mau",
      "Ca Mau",
    ],
  },
];

for (const fallback of regionalFallbacks) {
  for (const alias of fallback.aliases) {
    cityAliases[normalizeLocation(alias)] = fallback.key;
  }
}

export const getVerifiedLocationKey = (location?: string | null) => {
  const normalized = normalizeLocation(location);
  if (!normalized) return null;
  return cityAliases[normalized] ?? null;
};

export const getVerifiedCityName = (location?: string | null) => {
  const key = getVerifiedLocationKey(location);
  return key ? vietnamLocationRecords[key].label : null;
};

export const getCityImages = (location?: string | null, count = 3) => {
  const key = getVerifiedLocationKey(location);
  if (!key) return [];

  const pool = vietnamLocationRecords[key].images;
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const safeIndex = index % pool.length;
    return pool[safeIndex];
  });
};

export const getCityImage = (location?: string | null, index = 0) =>
  getCityImages(location, index + 1)[index] ?? DEFAULT_VIETNAM_FALLBACK_IMAGE;

export const getLocationImages = getCityImages;
export const getLocationImage = getCityImage;
export const getSmartVerifiedLocationImage = getCityImage;
export const getVerifiedLocationImages = getCityImages;
export const isVerifiedLocation = (location?: string | null) =>
  Boolean(getVerifiedLocationKey(location));

export const getLocationLabel = (location?: string | null) =>
  getVerifiedCityName(location) ?? location ?? "";

export const getNearbyVietnamLocationImages = getCityImages;

export const cityImageKeys = Object.keys(cityImages) as CityName[];

export const DEFAULT_VIETNAM_FALLBACK_IMAGE = HOTEL_POOLS.homestay[0];

export const VERIFIED_LOCATION_IMAGES = cityImages;

export const getLocationAlt = (location?: string | null) =>
  `Ảnh khách sạn hoặc homestay tại ${getLocationLabel(location)}`;
