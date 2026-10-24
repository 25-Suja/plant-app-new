import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Camera,
  Hammer,
  Home,
  Info,
  Leaf,
  Lock,
  Mail,
  Map,
  Menu,
  NotebookPen,
  Play,
  Recycle,
  TreePine,
  Trees,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const EMAIL_KEY = 'glowbots:email'
const INTRO_KEY = 'glowbots:intro-complete'

export function Logo({ size = 48, className }: { size?: number; className?: string }) {
  // Drop the team logo at public/glowbots-logo.png to replace the emblem.
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <img
        src="/glowbots-logo.png"
        alt="Avonwood GlowBots logo"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={cn('rounded-full object-cover shrink-0', className)}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label="Avonwood GlowBots logo"
      className={cn(
        'grid place-items-center rounded-full bg-gradient-to-br from-[#8ecf70] via-leaf to-forest text-white shrink-0 ring-2 ring-white/60',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Leaf style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} />
    </span>
  )
}

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/scan', label: 'Scan a Plant', icon: Camera },
  { to: '/disposal', label: 'Disposal', icon: Recycle },
  { to: '/maps', label: 'Maps', icon: Map },
  { to: '/about', label: 'About Us', icon: Info },
] as const

function NavRibbon() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-forest text-white shadow-md">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="font-display text-xl font-bold tracking-tight">GlowBots</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white data-[status=active]:bg-white data-[status=active]:text-forest"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <button
          className="md:hidden rounded-full p-2 hover:bg-white/10"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden grid gap-1 border-t border-white/10 px-4 py-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === '/' }}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-white/90 data-[status=active]:bg-white data-[status=active]:text-forest"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

type GateState = 'loading' | 'email' | 'intro' | 'ready'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<GateState>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem(EMAIL_KEY) ?? ''
    setEmail(savedEmail)
    if (localStorage.getItem(INTRO_KEY) === '1') setGate('ready')
    else setGate(savedEmail ? 'intro' : 'email')
  }, [])

  if (gate === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center">
        <Logo size={64} className="animate-pulse" />
      </div>
    )
  }
  if (gate === 'email') {
    return (
      <EmailEntry
        onSubmit={(value) => {
          localStorage.setItem(EMAIL_KEY, value)
          setEmail(value)
          setGate('intro')
        }}
      />
    )
  }
  if (gate === 'intro') {
    return (
      <Introduction
        email={email}
        onComplete={() => {
          localStorage.setItem(INTRO_KEY, '1')
          setGate('ready')
        }}
      />
    )
  }
  return (
    <div className="min-h-screen flex flex-col">
      <NavRibbon />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white/60 py-6 text-center text-xs text-muted-foreground">
        Built by the Avonwood GlowBots · FIRST LEGO League · Avon, CT — Learn. Identify. Restore.
      </footer>
    </div>
  )
}

function EmailEntry({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = value.trim()
    if (!v.includes('@') || !v.split('@').pop()?.includes('.')) {
      setError('Enter an email address to continue.')
      return
    }
    onSubmit(v)
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef4ea] to-[#f8faf6] px-5 py-10 flex flex-col items-center justify-center gap-6">
      <div className="grid w-full max-w-5xl gap-7 md:grid-cols-[1.2fr_1fr] items-stretch">
        <section className="relative overflow-hidden rounded-[28px] p-9 text-white shadow-xl">
          <img
            src="/.netlify/images?url=/img/woodland.png&w=1100&fm=webp"
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#123a29]/95 via-[#1b5e20]/85 to-[#2e7d32]/60" />
          <div className="relative flex h-full flex-col gap-5">
            <div className="flex items-center gap-4">
              <Logo size={64} />
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-moss">AVONWOOD GLOWBOTS</p>
                <p className="font-display text-2xl font-bold">Rooted in community.</p>
              </div>
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">
              Know what grows here.
            </h1>
            <p className="text-lg text-[#e4efe0] max-w-md">
              A field guide for identifying plants, understanding their place in local ecosystems,
              and taking informed action.
            </p>
            <ul className="mt-2 grid gap-4">
              <li className="flex gap-3">
                <Camera className="mt-0.5 size-5 text-moss" />
                <div>
                  <p className="font-semibold">Identify with confidence</p>
                  <p className="text-sm text-moss">Woodland-ready camera and two-engine identification.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Recycle className="mt-0.5 size-5 text-moss" />
                <div>
                  <p className="font-semibold">Remove and dispose safely</p>
                  <p className="text-sm text-moss">Step-by-step guides so invasives don't come back.</p>
                </div>
              </li>
            </ul>
            <p className="mt-auto pt-4 text-sm text-[#e4efe0]">Built by the Avonwood GlowBots • Avon, CT</p>
          </div>
        </section>
        <form
          onSubmit={submit}
          className="flex flex-col items-center justify-center gap-4 rounded-[28px] bg-white p-8 shadow-[0_12px_28px_rgba(14,38,23,0.09)] text-center"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-leaf">
            <Leaf className="size-7" />
          </span>
          <h2 className="font-display text-3xl font-bold text-forest">Welcome to GlowBots</h2>
          <p className="text-sm text-muted-foreground">Enter your email to start the short introduction.</p>
          <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              autoFocus
              placeholder="you@example.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-11 pl-9"
              aria-label="Email address"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Continue <ArrowRight />
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex w-full items-center gap-3 text-[10px] tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            DEMO ENTRY
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs text-muted-foreground">
            This is for demonstration only. No account is created, and your email stays on this
            device.
          </p>
        </form>
      </div>
      <p className="text-[11px] tracking-widest text-muted-foreground">
        GLOWBOTS PLANT SCANNER • LEARN. IDENTIFY. RESTORE.
      </p>
    </div>
  )
}

const SCENES = [
  {
    icon: TreePine,
    heading: 'A plant can change a whole place',
    body: 'When a plant spreads beyond its natural range, it can take space, light, and resources from the native species local wildlife depends on.',
  },
  {
    icon: Trees,
    heading: 'Why removal matters',
    body: 'Careful, informed removal can help restore room for native plants and support healthier, more resilient habitats.',
  },
  {
    icon: Users,
    heading: 'Meet the Avonwood GlowBots',
    body: 'We are a FIRST LEGO League team from Avon, Connecticut. Our community work with Japanese barberry inspired us to make invasive-plant information easier to access.',
  },
  {
    icon: Hammer,
    heading: 'Small actions add up',
    body: 'We built a shrub-removal tool and this plant scanner to help people learn. Identify plants carefully and follow local guidance before removal.',
  },
]
const SCENE_MS = 4000

function Introduction({ email, onComplete }: { email: string; onComplete: () => void }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const start = useRef(0)
  const total = SCENES.length * SCENE_MS

  useEffect(() => {
    if (!running) return
    start.current = performance.now()
    let frame = 0
    const tick = () => {
      const t = performance.now() - start.current
      setElapsed(t)
      if (t >= total) {
        setRunning(false)
        setTimeout(onComplete, 600)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, total, onComplete])

  const index = Math.min(SCENES.length - 1, Math.floor(elapsed / SCENE_MS))
  const scene = SCENES[index]
  const done = elapsed >= total
  const Icon = scene.icon

  return (
    <div className="min-h-screen bg-background px-5 py-8 flex flex-col items-center justify-center gap-5">
      <div className="flex items-center gap-3">
        <Logo size={48} />
        <div>
          <p className="text-[11px] font-bold tracking-widest text-leaf">GLOWBOTS FIELD GUIDE</p>
          <p className="font-display text-lg font-bold text-forest">Your welcome story</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4 text-leaf" /> Features unlock after this short introduction
      </p>
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl shadow-xl">
        <img
          src="/.netlify/images?url=/img/woodland.png&w=1100&fm=webp"
          alt=""
          className="absolute inset-0 size-full object-cover scale-110 transition-transform duration-[4000ms]"
          style={{ transform: `scale(${1.1 + index * 0.04})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#163c2c]/95 to-[#285d3b]/85" />
        <div
          key={running || done ? index : 'idle'}
          className="relative flex min-h-80 flex-col items-center justify-center gap-5 p-8 text-center text-white animate-in fade-in slide-in-from-bottom-3 duration-700"
        >
          <span className="grid size-28 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
            {running || done ? <Icon className="size-16 text-[#b9e2a6]" /> : <TreePine className="size-16 text-[#b9e2a6]" />}
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            {running || done ? scene.heading : 'Welcome to GlowBots'}
          </h2>
          <p className="max-w-xl text-[#e0ece2]">
            {running || done
              ? scene.body
              : 'A short introduction to invasive plants, our team, and why removal matters.'}
          </p>
        </div>
      </div>
      <div className="w-full max-w-3xl rounded-3xl bg-white p-7 text-center shadow-[0_8px_22px_rgba(14,38,23,0.09)] grid gap-4">
        <h3 className="font-display text-2xl font-bold text-forest">Invasive plants: a short introduction</h3>
        <p className="text-sm text-muted-foreground">
          A quick story about invasive plants, our team, and why thoughtful removal matters.
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-[#42604c]/20">
          <div className="h-full rounded-full bg-[#8ecf70]" style={{ width: `${(elapsed / total) * 100}%` }} />
        </div>
        <p className={cn('text-sm', done ? 'text-leaf font-medium' : 'text-muted-foreground')}>
          {done
            ? 'Introduction complete. Your app is ready.'
            : running
              ? `GlowBots field guide • Scene ${index + 1} of ${SCENES.length}`
              : `Welcome, ${email}. Watch the short introduction to unlock the app.`}
        </p>
        <Button size="lg" className="mx-auto" disabled={running || done} onClick={() => setRunning(true)}>
          <Play /> Play introduction
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <NotebookPen className="size-3.5" /> Animated introduction • About 16 seconds
      </p>
    </div>
  )
}

export function PageBanner({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-forest to-leaf px-6 py-10 text-center text-white">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -left-10 bottom-0 size-40 rounded-full bg-white/5" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-2">
        {icon}
        <h1 className="font-display text-3xl md:text-4xl font-bold">{title}</h1>
        <p className="text-moss">{subtitle}</p>
      </div>
    </section>
  )
}

export function SectionCard({
  icon: Icon,
  title,
  children,
  className,
  tone = 'leaf',
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  className?: string
  tone?: 'leaf' | 'danger' | 'warn'
}) {
  return (
    <section className={cn('rounded-[20px] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]', className)}>
      <div className="mb-3 flex items-center gap-2.5">
        {Icon && (
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full text-white',
              tone === 'leaf' && 'bg-leaf',
              tone === 'danger' && 'bg-danger',
              tone === 'warn' && 'bg-warn',
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        )}
        <h2 className="font-display text-lg font-bold text-forest">{title}</h2>
      </div>
      <div className="border-t border-border pt-3">{children}</div>
    </section>
  )
}
