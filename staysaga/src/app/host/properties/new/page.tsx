import { redirect } from "next/navigation";

export default function NewHostPropertyPage() {
  redirect("/host/register?new=1");
}
