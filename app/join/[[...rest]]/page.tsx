import { SignUpScreen } from "@/components/sign-up-screen"

// Kept for backward-compat and as an internal alias. New marketing CTAs
// point at /start to dodge TikTok's auth-keyword URL safety screen.
export default function JoinPage() {
  return <SignUpScreen path="/join" />
}
