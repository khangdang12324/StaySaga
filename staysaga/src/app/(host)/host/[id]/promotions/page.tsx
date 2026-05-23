import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Calculator, Megaphone, Percent, Search, Smartphone, Tag } from "lucide-react";
import { HostAccountMenu } from "../../_components/HostAccountMenu";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

async function getProperty(id: string, userId: string) {
  const supabase = await createClient();
  let { data } = await supabase
    .from("homestays")
    .select("id, name, owner_id")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  if (!data) {
    const admin = await createAdminClient();
    const retry = await admin
      .from("homestays")
      .select("id, name, owner_id")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();
    data = retry.data;
  }
  return data;
}

export default async function PromotionsPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login?next=/host");
  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { id } = await params;
  const property = await getProperty(id, session.user.id);
  if (!property) notFound();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <Header propertyName={property.name || "Chỗ nghỉ"} propertyId={property.id} userName={userName} />
      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="text-sm">
          <Link href={`/host/${property.id}`} className="text-[#f60057]">Chỗ nghỉ</Link>
          <span className="mx-2">›</span>
          <span>Chọn khuyến mãi mới</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-6">
          <h1 className="text-3xl font-bold">Chọn khuyến mãi mới</h1>
          <button className="inline-flex items-center gap-2 bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004c]">
            <Calculator className="h-5 w-5" />
            Tính mức giảm giá tối đa
          </button>
        </div>

        <DealSection
          title="Campaign deals"
          description="Tăng hiển thị trong email, thông báo đẩy, website liên kết và các kênh khác khi Quý vị áp dụng giảm giá."
          deals={[
            {
              icon: <Megaphone className="h-12 w-12 text-[#f60057]" />,
              title: "Ưu Đãi Mùa Du Lịch",
              subtitle: "Gợi ý giảm giá 20% hoặc hơn",
              meta: "Thời gian đặt: 12 tháng 3, 2026 - 30 tháng 9, 2026",
              text: "Lấp phòng trống và nâng cao độ hiện diện trên nền tảng.",
            },
          ]}
          propertyId={property.id}
        />
        <DealSection
          title="Targeting"
          description="Nhắm khuyến mãi tới các nhóm khách cụ thể và trở thành lựa chọn yêu thích."
          deals={[
            {
              icon: <Smartphone className="h-12 w-12 text-[#f60057]" />,
              title: "Giá trên điện thoại",
              subtitle: "Giảm giá 10% và hơn nữa",
              meta: "Luôn hoạt động, không giới hạn số ngày áp dụng",
              text: "Trở thành lựa chọn hàng đầu của khách đặt trên điện thoại.",
              href: `/host/${property.id}/promotions/mobile`,
            },
          ]}
          propertyId={property.id}
        />
        <DealSection
          title="Portfolio deals"
          description="Cải thiện tỷ lệ lấp phòng với các loại ưu đãi có thể tùy chỉnh."
          deals={[
            {
              icon: <Tag className="h-12 w-12 text-[#f60057]" />,
              title: "Ưu Đãi Cơ Bản",
              subtitle: "Gợi ý giảm giá 10% hoặc hơn",
              meta: "Bất cứ ngày nào",
              text: "Tùy chỉnh ưu đãi theo nhu cầu của Quý vị.",
            },
            {
              icon: <Percent className="h-12 w-12 text-[#f60057]" />,
              title: "Ưu Đãi Phút Cuối",
              subtitle: "Gợi ý giảm giá 10% hoặc hơn",
              meta: "Bất cứ ngày nào",
              text: "Lấp đầy những phòng trống Quý vị còn lại.",
            },
            {
              icon: <Megaphone className="h-12 w-12 text-[#f60057]" />,
              title: "Ưu Đãi Cho Khách Đặt Sớm",
              subtitle: "Gợi ý giảm giá 10% hoặc hơn",
              meta: "Bất cứ ngày nào",
              text: "Có thêm thời gian chuẩn bị khi nhận đặt phòng sớm hơn.",
            },
          ]}
          propertyId={property.id}
        />
        <p className="mt-8 border-t border-gray-300 pt-6">
          <strong>Hãy đảm bảo rằng Quý vị đang đưa ra giảm giá thực thụ.</strong>{" "}
          Theo luật định, khuyến mãi phải có giảm giá thực thụ cho khách.
        </p>
      </main>
    </div>
  );
}

function Header({ propertyName, propertyId, userName }: { propertyName: string; propertyId: string; userName: string }) {
  return (
    <header className="bg-[#f60057] text-white">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
        <Link href="/host" className="text-3xl font-bold">StaySaga</Link>
        <span className="hidden h-8 w-px bg-white/35 md:block" />
        <div className="hidden md:block">
          <p className="font-bold">{propertyName}</p>
          <p className="text-sm text-white/80">ID {propertyId.slice(0, 8)}</p>
        </div>
        <div className="ml-auto hidden h-12 w-full max-w-[540px] items-center rounded-sm bg-white/10 px-4 lg:flex">
          <span className="flex-1 text-white/90">Tìm kiếm</span>
          <Search className="h-5 w-5" />
        </div>
        <HostAccountMenu userName={userName} />
      </div>
    </header>
  );
}

function DealSection({
  title,
  description,
  deals,
  propertyId,
}: {
  title: string;
  description: string;
  propertyId: string;
  deals: Array<{ icon: ReactNode; title: string; subtitle: string; meta: string; text: string; href?: string }>;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-gray-600">{description}</p>
      <div className="mt-4 border border-gray-300 bg-white">
        {deals.map((deal) => (
          <div key={deal.title} className="grid gap-6 border-b border-gray-200 p-8 last:border-b-0 md:grid-cols-[120px_1.2fr_1fr_1fr_auto] md:items-center">
            <div>{deal.icon}</div>
            <div>
              <h3 className="text-2xl font-bold">{deal.title}</h3>
              <p className="mt-2 font-bold">{deal.subtitle}</p>
              <span className="mt-2 inline-flex border border-gray-400 px-2 py-1 text-sm">Badge</span>
            </div>
            <p>{deal.meta}</p>
            <p className="text-gray-600">{deal.text}</p>
            <Link
              href={deal.href || `/host/${propertyId}/promotions/mobile`}
              className="border border-[#f60057] px-6 py-3 text-center font-bold text-[#f60057] hover:bg-rose-50"
            >
              Thêm khuyến mãi
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
