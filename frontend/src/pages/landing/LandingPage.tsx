import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Network, ShieldCheck, Users, Wallet } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div>
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0B3D91] text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(5,150,105,0.35),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(212,160,23,0.2),transparent_45%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <BrandLogo to={undefined} size="xl" showText={false} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            Family Data Center
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 max-w-3xl text-2xl font-semibold leading-snug text-white/95 sm:text-3xl"
          >
            Manage Your Family. Protect Your Data. Build Your Future.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-4 max-w-xl text-base text-white/75"
          >
            One Family. One Data Center. One Future.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" variant="accent">
              <Link to="/">Sign in</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/">Login</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">Built for modern families</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everything your household needs to manage shared life without scattered spreadsheets.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: 'Member directory',
              text: 'Profiles, roles, and emergency contacts in one living directory.',
            },
            {
              icon: Wallet,
              title: 'Family finances',
              text: 'Track income, expenses, savings, assets, debts, and goals together.',
            },
            {
              icon: Network,
              title: 'Living family tree',
              text: 'Visualize relationships across generations with clarity.',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-l-2 border-primary pl-5"
            >
              <feature.icon className="h-6 w-6 text-secondary" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-card/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Launch a private family workspace in minutes.
          </p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              'Register and create your family profile',
              'Invite members and build your directory',
              'Record finances, events, documents, and goals',
            ].map((step, index) => (
              <li key={step} className="relative">
                <span className="text-5xl font-extrabold text-primary/15">{index + 1}</span>
                <p className="mt-2 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Security first</h2>
            <p className="mt-3 text-muted-foreground">
              Role-based access, JWT authentication, and audit-friendly activity logs keep sensitive
              family data protected.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" /> Encrypted sessions & refresh tokens
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-secondary" /> Family-scoped permissions
              </li>
            </ul>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary to-[#07285f] p-8 text-white shadow-lg">
            <p className="text-2xl font-semibold">Ready when your family is.</p>
            <p className="mt-3 text-white/75">
              Start organizing profiles, budgets, and milestones in a single trusted place.
            </p>
            <Button asChild className="mt-6" variant="accent">
              <Link to="/">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
