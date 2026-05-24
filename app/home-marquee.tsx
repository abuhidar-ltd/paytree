"use client"

const ITEMS = [
  "Trading Educators",
  "Course Creators",
  "Fitness Coaches",
  "Newsletter Writers",
  "Digital Artists",
  "Finance Creators",
  "Podcasters",
  "SaaS Founders",
  "YouTube Creators",
  "Music Producers",
  "Web3 Builders",
  "Community Leaders",
]

export function HomeMarquee() {
  const content = ITEMS.map((item) => item).join(" · ") + " · "

  return (
    <section className="border-y border-white/[0.06] bg-white/[0.02] py-6 overflow-hidden">
      <div className="text-center mb-4">
        <p className="text-xs font-mono text-[#444] uppercase tracking-widest">
          Trusted by traders, educators, coaches, and creators
        </p>
      </div>
      <div className="relative">
        <div className="marquee-track flex whitespace-nowrap">
          <span className="text-sm font-mono text-[#555] tracking-wide">{content}</span>
          <span className="text-sm font-mono text-[#555] tracking-wide">{content}</span>
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee 30s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
