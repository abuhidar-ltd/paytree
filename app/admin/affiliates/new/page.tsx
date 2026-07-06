import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { requireAdmin } from "@/lib/admin"
import { Card, PageTitle } from "../../ui"
import { CreateAffiliateForm } from "../affiliate-forms"

export const dynamic = "force-dynamic"

export default async function NewAffiliatePage() {
  noStore()
  await requireAdmin()

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/affiliates" className="text-xs font-mono text-[#c9c9d1] hover:text-white">
          ← Affiliates
        </Link>
      </div>
      <PageTitle title="New affiliate" subtitle="Slug goes into the referral URL. Stats token is generated automatically." />
      <Card>
        <CreateAffiliateForm />
      </Card>
    </>
  )
}
