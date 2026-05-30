import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { HostExtranetShell } from "@/app/(host)/host/_components/HostExtranetShell";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <HostExtranetShell active="home" userName="Đối tác">
      <main className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="mb-6">
          <Link href="/host" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0071c2] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Quay lại Host Dashboard
          </Link>
        </div>
        
        <div className="rounded-sm border border-gray-200 bg-white p-10 text-center shadow-sm max-w-2xl mx-auto">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-[#f60057]">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="mb-4 text-3xl font-black text-slate-800">{title}</h1>
          <p className="mb-8 text-lg text-slate-600">{description}</p>
          <div className="inline-block rounded bg-rose-50 px-4 py-2 font-semibold text-[#f60057] border border-rose-200">
            Chức năng đang được phát triển
          </div>
        </div>
      </main>
    </HostExtranetShell>
  );
}
