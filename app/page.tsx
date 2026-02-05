import { redirect } from "next/navigation"

export default async function Home() {
  // Redirect to admin dashboard immediately
  redirect("/admin/dashboard")
}
