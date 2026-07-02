import { headers } from "next/headers"
import { SignUpV4 } from "./sign-up-v4"

export const metadata = {
  title: "Claim your paytree — email + password (v4 preview)",
  robots: { index: false, follow: false },
}

export default async function RegisterV4Page() {
  const ua = (await headers()).get("user-agent") ?? ""
  return <SignUpV4 userAgent={ua} />
}
