import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { requireAdmin } from "@/lib/admin"
import { getFraudClusters, type FraudCluster } from "@/lib/fraud-detection"
import { Card, PageTitle, nf, fmtDateTime, maskId } from "../ui"
import { setSuspiciousAction } from "./actions"

export const dynamic = "force-dynamic"

/**
 * Duplicate-signup review — clusters of 3+ accounts sharing a device
 * fingerprint or an IP. FLAGGING for a human, never auto-action: shared IPs
 * are everyday reality (carrier NAT, shared WiFi, VPNs, families), so the
 * page's job is to make "one person, five throwaways" visually obvious and
 * leave the call to the admin. Strongest combined tell surfaced per cluster:
 * shared device + zero verified emails.
 */
export default async function AdminFraudPage() {
  noStore()
  await requireAdmin()

  // Null = the SignupFingerprint table isn't in this environment's DB yet
  // (scripts/push-prod-schema.sh) — show a pointed message, not a 500.
  const clusters = await getFraudClusters().catch((err) => {
    console.error("[admin] fraud clusters failed (run scripts/push-prod-schema.sh?):", err)
    return null
  })
  const deviceClusters = (clusters ?? []).filter((c) => c.kind === "device")
  const ipClusters = (clusters ?? []).filter((c) => c.kind === "ip")

  if (clusters === null) {
    return (
      <>
        <PageTitle title="Fraud review" subtitle="signup fingerprint data unavailable" />
        <Card>
          <p className="text-xs font-mono text-[#f59e0b]">
            Couldn&apos;t query SignupFingerprint — if this is production, the schema push is
            pending: <span className="text-[#c9c9d1]">bash scripts/push-prod-schema.sh &lt;prod-url&gt;</span>
          </p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageTitle
        title="Fraud review"
        subtitle={`${nf(deviceClusters.length)} device cluster(s) · ${nf(ipClusters.length)} IP cluster(s) · flagging is manual and never blocks anyone`}
      />

      {clusters.length === 0 ? (
        <Card>
          <p className="text-xs font-mono text-[#c9c9d1]">
            No clusters — no 3+ accounts currently share a device fingerprint or IP.
          </p>
        </Card>
      ) : (
        <>
          <SectionHeader
            label="Shared device"
            hint="strongest signal — same physical browser/device, survives cookie clearing and different emails"
          />
          {deviceClusters.map((c) => (
            <ClusterCard key={`d-${c.key}`} cluster={c} />
          ))}
          {deviceClusters.length === 0 && (
            <p className="text-xs font-mono text-[#666] mb-6">No shared-device clusters.</p>
          )}

          <SectionHeader
            label="Shared IP"
            hint="weak signal alone — carrier NAT and shared WiFi routinely put real, unrelated people on one IP"
          />
          {ipClusters.map((c) => (
            <ClusterCard key={`i-${c.key}`} cluster={c} />
          ))}
          {ipClusters.length === 0 && (
            <p className="text-xs font-mono text-[#666]">No shared-IP clusters.</p>
          )}
        </>
      )}
    </>
  )
}

function SectionHeader({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-3 mt-2">
      <h2 className="text-sm font-mono uppercase tracking-widest text-[#e0e0e0]">{label}</h2>
      <p className="text-[11px] font-mono text-[#888] mt-0.5">{hint}</p>
    </div>
  )
}

function ClusterCard({ cluster }: { cluster: FraudCluster }) {
  const geo = [...new Set(cluster.members.map((m) => [m.city, m.country].filter(Boolean).join(", ")).filter(Boolean))]
  const flaggedCount = cluster.members.filter((m) => m.flaggedSuspicious).length

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`text-[10px] font-mono uppercase tracking-widest rounded px-1.5 py-0.5 border ${
            cluster.kind === "device"
              ? "text-[#ff5555] border-[#ff5555]/30"
              : "text-[#f59e0b] border-[#f59e0b]/30"
          }`}
        >
          {cluster.kind === "device" ? "same device" : "same ip"}
        </span>
        <span className="text-xs font-mono text-[#c9c9d1]">
          {cluster.kind === "device" ? maskId(cluster.key) : cluster.key} · {cluster.members.length} accounts
        </span>
        {geo.length > 0 && <span className="text-[11px] font-mono text-[#888]">{geo.join(" / ")}</span>}
        {cluster.allUnverified && (
          <span
            className="text-[10px] font-mono uppercase tracking-widest text-black bg-[#ff5555] rounded px-1.5 py-0.5"
            title="Nobody in this cluster verified their email — real people verify, throwaway inboxes don't."
          >
            all unverified
          </span>
        )}
        {flaggedCount > 0 && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#f59e0b]">
            {flaggedCount} flagged
          </span>
        )}
      </div>

      <form action={setSuspiciousAction}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#c9c9d1] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-3 w-6"></th>
                <th className="py-2 pr-4">Account</th>
                <th className="py-2 pr-4">Signed up</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2 pr-4">Published</th>
                <th className="py-2 pr-4">Flagged</th>
              </tr>
            </thead>
            <tbody>
              {cluster.members.map((m) => (
                <tr key={m.userId} className="border-b border-white/[0.04] text-[#d0d0d0]">
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      name="userIds"
                      value={m.userId}
                      defaultChecked
                      className="accent-[#00ff88]"
                      aria-label={`Select ${m.email}`}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <Link href={`/admin/users/${m.userId}`} className="text-[#00ff88] hover:underline">
                      {m.email}
                    </Link>
                    {m.username ? <span className="ml-2 text-[#888]">@{m.username}</span> : null}
                  </td>
                  <td className="py-2 pr-4">{fmtDateTime(m.createdAt)}</td>
                  <td className="py-2 pr-4">
                    {m.emailVerified ? "✓" : <span className="text-[#ff5555]">✗</span>}
                  </td>
                  <td className="py-2 pr-4">
                    {m.pageStatus === "published" ? "✓" : <span className="text-[#888]">✗</span>}
                  </td>
                  <td className="py-2 pr-4">
                    {m.flaggedSuspicious ? (
                      <span className="text-[#f59e0b]">flagged</span>
                    ) : (
                      <span className="text-[#666]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            type="submit"
            name="flag"
            value="1"
            className="rounded-lg px-3 py-1.5 text-[11px] font-mono font-bold text-black bg-[#f59e0b] hover:opacity-90 cursor-pointer"
          >
            Flag selected as suspicious
          </button>
          <button
            type="submit"
            name="flag"
            value="0"
            className="rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#c9c9d1] border border-white/[0.1] hover:text-white cursor-pointer"
          >
            Unflag selected
          </button>
          <span className="text-[10px] font-mono text-[#666]">
            tags only — never blocks login or features
          </span>
        </div>
      </form>
    </Card>
  )
}
