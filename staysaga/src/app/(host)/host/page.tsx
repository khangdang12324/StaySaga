import {
  Calendar,
  DollarSign,
  Home,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import {
  createHostHomestay,
  deleteHostHomestay,
  getHostDashboardData,
  HostListing,
  updateHostHomestay,
} from "@/core/host/actions";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import StepperHomestayForm from "./_components/StepperHomestayForm";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const currency = new Intl.NumberFormat("vi-VN");

const statusMessages: Record<string, string> = {
  created: "Da them homestay moi.",
  updated: "Da cap nhat homestay.",
  deleted: "Da xoa homestay.",
};

const errorMessages: Record<string, string> = {
  invalid: "Vui long kiem tra lai cac truong bat buoc.",
  image_type: "Anh tai len phai la tep hinh.",
  image_size: "Anh tai len toi da 5MB.",
  upload_failed: "Khong the tai anh len Supabase Storage.",
  image_save_failed: "Khong the luu thong tin anh.",
  create_failed: "Khong the tao homestay.",
  update_failed: "Khong the cap nhat homestay.",
  delete_failed: "Khong the xoa homestay.",
};

function getImage(listing: HostListing) {
  return listing.homestay_images?.[0]?.url || getLocationImage(listing.city);
}

export default async function HostDashboardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const role = await getUserRole(supabase, session.user.id);
  if (!canAccessPartner(role)) {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const status =
    typeof resolvedParams.status === "string" ? resolvedParams.status : "";
  const error =
    typeof resolvedParams.error === "string" ? resolvedParams.error : "";
  const { listings, totalRevenue, pendingBookings, averageRating } =
    await getHostDashboardData();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
              Host dashboard
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 dark:text-white">
              Quan ly homestay
            </h1>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {listings.length} cho o dang quan ly
          </div>
        </div>

        {status && statusMessages[status] && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {statusMessages[status]}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessages[error] || "Khong the xu ly yeu cau."}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <DollarSign className="mb-3 h-5 w-5 text-emerald-500" />
            <p className="text-sm text-zinc-500">Doanh thu</p>
            <p className="mt-1 text-2xl font-black">
              {currency.format(totalRevenue)}d
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Calendar className="mb-3 h-5 w-5 text-blue-500" />
            <p className="text-sm text-zinc-500">Don cho xu ly</p>
            <p className="mt-1 text-2xl font-black">{pendingBookings}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Home className="mb-3 h-5 w-5 text-rose-500" />
            <p className="text-sm text-zinc-500">Homestay dang mo</p>
            <p className="mt-1 text-2xl font-black">
              {listings.filter((listing) => listing.is_active).length}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Star className="mb-3 h-5 w-5 text-amber-500" />
            <p className="text-sm text-zinc-500">Danh gia TB</p>
            <p className="mt-1 text-2xl font-black">
              {averageRating ? averageRating.toFixed(1) : "-"}
            </p>
          </div>
        </div>

        <section className="mb-10 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Them homestay moi</h2>
            </div>
          </div>
          <StepperHomestayForm mode="create" action={createHostHomestay} />
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              Danh sach homestay
            </h2>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <ImageIcon className="mx-auto mb-4 h-10 w-10 text-zinc-400" />
              <h3 className="font-bold">Chua co homestay nao</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {listings.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
                    <div className="relative min-h-60 bg-zinc-100 dark:bg-zinc-800">
                      <SafeImage
                        src={getImage(listing)}
                        alt={listing.name}
                        className="h-full min-h-60 w-full object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-zinc-700 shadow-sm">
                        {listing.is_active ? "Dang hien thi" : "Dang an"}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-zinc-950 dark:text-white">
                            {listing.name}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                            <MapPin className="h-4 w-4" />
                            {listing.city}, {listing.country}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {listing.max_guests}
                          </span>
                          <span className="font-black text-rose-600">
                            {currency.format(listing.price_per_night)}d/dem
                          </span>
                        </div>
                      </div>
                      <StepperHomestayForm listing={listing} mode="edit" action={updateHostHomestay} />

                      <form action={deleteHostHomestay} className="mt-4">
                        <input type="hidden" name="id" value={listing.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xoa homestay
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
