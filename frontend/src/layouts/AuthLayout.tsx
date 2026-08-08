import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0B3D91] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,160,23,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(5,150,105,0.28),transparent_40%),linear-gradient(160deg,#0B3D91,#07285f)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            Family Data Center
          </Link>
          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight">
              One secure home for your family&apos;s shared life.
            </h2>
            <p className="mt-4 max-w-sm text-white/75">
              Members, finances, documents, events, and goals — organized for every generation.
            </p>
          </div>
          <p className="text-sm text-white/60">Trusted by families managing complex records.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="text-xl font-bold text-primary">
              Family Data Center
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
