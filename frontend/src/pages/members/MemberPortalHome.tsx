import homeBg from '@/assets/WhatsApp Image 2026-07-26 at 14.23.39.jpeg'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useFamily } from '@/hooks/useFamilyId'
import { useAuthStore } from '@/stores/authStore'

export function MemberPortalHome() {
  const user = useAuthStore((s) => s.user)
  const family = useFamily()
  const name = user?.full_name || 'Member'
  const familyName = family?.name || 'your family'

  return (
    <section className="relative flex min-h-[calc(100vh-4.25rem)] items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeBg})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center text-white">
        <BrandLogo to={undefined} size="xl" showText={false} className="justify-center" />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-white/85">
          {familyName}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl">
          Welcome, {name}
        </h1>
      </div>
    </section>
  )
}
