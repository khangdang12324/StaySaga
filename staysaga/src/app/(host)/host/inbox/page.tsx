import { redirect } from "next/navigation";

export default function HostInboxRedirectPage() {
  redirect("/host/messages");
}
