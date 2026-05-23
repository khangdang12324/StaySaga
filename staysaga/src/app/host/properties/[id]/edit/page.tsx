import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUserRole, canAccessPartner, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "@/app/(host)/host/_components/HostExtranetShell";
import StepperHomestayForm from "@/app/(host)/host/_components/StepperHomestayForm";
import { updateHostHomestay } from "@/core/host/actions";

type EditHostPropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHostPropertyPage({ params }: EditHostPropertyPageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login?next=/host");
  }

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) {
    redirect("/host/onboard");
  }

  const { id } = await params;
  const select = "*, homestay_images(id, url, storage_path)";
  let { data: listing } = await supabase
    .from("homestays")
    .select(select)
    .eq("id", id)
    .eq("owner_id", session.user.id)
    .single();

  if (!listing) {
    const adminSupabase = await createAdminClient();
    const retry = await adminSupabase
      .from("homestays")
      .select(select)
      .eq("id", id)
      .eq("owner_id", session.user.id)
      .single();
    listing = retry.data;
  }

  if (!listing) {
    notFound();
  }

  if (listing.status === "DRAFT") {
    redirect(`/host/register?propertyId=${id}`);
  }

  // Normalize/cast database response to HostListing
  const formattedListing = {
    ...listing,
    price_per_night: Number(listing.price_per_night || 0),
    avg_rating: Number(listing.avg_rating || 0),
    max_guests: Number(listing.max_guests || 0),
    bedrooms: Number(listing.bedrooms || 0),
    beds: Number(listing.beds || 0),
    bathrooms: Number(listing.bathrooms || 0),
    is_active: Boolean(listing.is_active),
    homestay_images: (listing.homestay_images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      storage_path: img.storage_path || null,
    })),
  };

  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-[800px] px-6 py-12">
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
            Tiếp tục đăng ký chỗ nghỉ
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Hãy hoàn tất hoặc cập nhật các thông tin cơ bản, phòng ốc và hình ảnh của <strong className="text-[#f60057]">{formattedListing.name || "chỗ nghỉ"}</strong> để bắt đầu kinh doanh trên StaySaga.
          </p>
        </div>

        <StepperHomestayForm listing={formattedListing} mode="edit" action={updateHostHomestay} />
      </main>
    </HostExtranetShell>
  );
}
