import { redirect } from "next/navigation"

export default async function HomePage() {
  // Redirect to admin dashboard immediately
  redirect("/admin/dashboard")
}