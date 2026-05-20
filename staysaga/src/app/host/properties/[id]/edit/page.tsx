import { redirect } from "next/navigation";

type EditHostPropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHostPropertyPage({ params }: EditHostPropertyPageProps) {
  const { id } = await params;
  redirect(`/host/${id}`);
}
