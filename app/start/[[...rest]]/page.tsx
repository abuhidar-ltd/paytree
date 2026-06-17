import { SignUpScreen } from "@/components/sign-up-screen"

// Canonical signup entry. /start is used everywhere because TikTok's URL
// safety filter blocks hard navigations to common auth keywords (/join,
// /signup, /register). /start is a neutral word and isn't flagged.
export default function StartPage() {
  return <SignUpScreen path="/start" />
}
