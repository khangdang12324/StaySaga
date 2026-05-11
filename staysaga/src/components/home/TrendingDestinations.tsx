"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";

type Stay = {
  id: string;
  slug?: string;
  title: string;
  image: string;
  rating: number;
  price: number;
  distanceKm: number;
};

type Destination = {
  name: string;
  image: string;
  stays: Stay[];
};

type TrendingDestinationsProps = {
  destinations: Destination[];
  copy: {
    kicker: string;
    title: string;
    description: string;
    ctaAll: string;
    cardMeta: string;
    modalKicker: string;
    modalDescription: string;
    modalSectionTitle: string;
    modalCta: string;
    distanceLabel: string;
    priceLabel: string;
    perNightLabel: string;
    closeLabel: string;
  };
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600";

export default function TrendingDestinations({
  destinations,
  copy,
}: TrendingDestinationsProps) {
  const [active, setActive] = useState<Destination | null>(null);

  const stats = useMemo(
    () =>
      destinations.map((item) => ({
        name: item.name,
        staysCount: item.stays.length,
      })),
    [destinations],
  );

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-rose-500 font-semibold">
              {copy.kicker}
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-gray-900 font-[var(--font-display)]">
              {copy.title}
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl">{copy.description}</p>
          </div>
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-500 transition-colors"
          >
            {copy.ctaAll}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination, index) => (
            <button
              key={destination.name}
              type="button"
              onClick={() => setActive(destination)}
              className="group text-left relative overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm hover:shadow-xl transition-all"
            >
              <div className="relative h-56">
                <img
                  src={destination.image || FALLBACK_IMAGE}
                  alt={`Homestay tai ${destination.name}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={index < 2 ? "eager" : "lazy"}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <h3 className="text-2xl font-semibold text-white">
                    {destination.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {copy.cardMeta.replace(
                      "{count}",
                      String(
                        stats[index]?.staysCount || destination.stays.length,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-44 md:h-52">
              <img
                src={active.image || FALLBACK_IMAGE}
                alt={active.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                  {copy.modalKicker}
                </p>
                <h3 className="mt-2 text-3xl font-semibold font-[var(--font-display)]">
                  {active.name}
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  {copy.modalDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-gray-800 hover:bg-white"
                aria-label={copy.closeLabel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {copy.modalSectionTitle}
                </h4>
                <Link
                  href={`/homestays?location=${encodeURIComponent(active.name)}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-500"
                  onClick={() => setActive(null)}
                >
                  {copy.modalCta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.stays.map((stay) => {
                  const stayHref = stay.slug
                    ? `/homestays/${stay.slug}`
                    : `/homestays?location=${encodeURIComponent(active.name)}`;

                  return (
                    <Link
                      key={stay.id}
                      href={stayHref}
                      onClick={() => setActive(null)}
                      className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="h-36 overflow-hidden">
                        <img
                          src={stay.image || FALLBACK_IMAGE}
                          alt={stay.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">
                            {stay.title}
                          </p>
                          <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">
                            {stay.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {copy.distanceLabel.replace(
                            "{value}",
                            stay.distanceKm.toFixed(1),
                          )}
                        </p>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-xs text-gray-500">
                            {copy.priceLabel}
                          </span>
                          <span className="text-base font-bold text-gray-900">
                            {formatPrice(stay.price)} {copy.perNightLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
