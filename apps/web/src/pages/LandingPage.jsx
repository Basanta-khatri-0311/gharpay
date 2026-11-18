import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const handleNav = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const offset = 72 // sticky nav height
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center h-[64px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-12">
          <span className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
          <span className="text-[15px] font-semibold text-text">GharPay</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          <a href="#how-it-works" onClick={(e) => handleNav(e, 'how-it-works')} className="text-[14px] text-text-secondary hover:text-text transition-colors">How it works</a>
          <a href="#landlords"    onClick={(e) => handleNav(e, 'landlords')}    className="text-[14px] text-text-secondary hover:text-text transition-colors">For landlords</a>
          <a href="#renters"      onClick={(e) => handleNav(e, 'renters')}      className="text-[14px] text-text-secondary hover:text-text transition-colors">For renters</a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link to="/login"    className="text-[14px] font-medium text-text-secondary hover:text-text transition-colors px-3 py-2">Sign in</Link>
          <Link to="/register" className="text-[14px] font-semibold bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors leading-none">Get started</Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-5">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">Rental management, made for Nepal</p>
          <h1 className="text-4xl lg:text-[52px] font-medium leading-[1.08] tracking-tight text-text">
            Rent, bills, and<br />payments. All in<br />one place.
          </h1>
          <p className="text-base text-text-secondary max-w-[400px] leading-relaxed">
            Manage rent and household bills without spreadsheets,
            screenshots, or forgotten payments.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-md text-[15px] font-medium hover:bg-primary-hover transition-colors">Get started</Link>
            <a href="#how-it-works" className="inline-flex items-center gap-1 text-text-secondary px-5 py-3.5 text-[15px] hover:text-text transition-colors">
              See how it works <span>›</span>
            </a>
          </div>
          <p className="text-xs text-text-muted">Free to set up · No card required</p>
        </div>

        {/* Dashboard preview card */}
       {/* Wrapper needed for the 3D depth effect */}
<div className="hidden lg:block [perspective:1200px]">
  <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden transition-transform duration-100 ease-out [transform:rotateY(-12deg)_rotateX(4deg)_rotateZ(1deg)] hover:[transform:rotateY(-4deg)_rotateX(1deg)_rotateZ(0deg)]">
    
    {/* --- Your existing card content --- */}
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center text-[11px] font-bold">G</span>
        <span className="text-[13px] font-semibold">GharPay</span>
      </div>
      <span className="flex-1 text-center text-[13px] text-text-secondary">October overview</span>
      <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-semibold">BK</div>
    </div>
    <div className="flex">
      <div className="w-[110px] border-r border-border p-3 flex flex-col gap-1 shrink-0">
        <span className="text-xs text-primary bg-primary-light px-2.5 py-1.5 rounded-md font-medium">Overview</span>
        <span className="text-xs text-text-muted px-2.5 py-1.5">Properties</span>
        <span className="text-xs text-text-muted px-2.5 py-1.5">Payments</span>
        <span className="text-xs text-text-muted px-2.5 py-1.5">Receipts</span>
      </div>
      <div className="flex-1 p-5 flex flex-col gap-2">
        <p className="text-[11px] text-text-muted">Collected this month</p>
        <p className="text-2xl font-bold tracking-tight">NPR 86,500</p>
        <p className="text-xs text-accent font-medium mb-3">↑ 12% from September</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-semibold shrink-0">AS</div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-medium truncate">Aayush Sharma</span>
              <span className="block text-[11px] text-text-muted">Siddhartha Nagar · Room 02</span>
            </div>
            <span className="text-xs font-medium whitespace-nowrap">NPR 18,000</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">Paid</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg">
            <div className="w-7 h-7 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">RT</div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-medium truncate">Riya Thapa</span>
              <span className="block text-[11px] text-text-muted">Kalikasthan · Flat 3A</span>
            </div>
            <span className="text-xs font-medium whitespace-nowrap">NPR 24,500</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning">Pending</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
      </div>
    </section>
  )
}

/* ─── Features ───────────────────────────────────────────────────────────── */
const features = [
  { num: '01', title: 'Monthly bills', desc: 'Combine rent and recurring utilities into one clear monthly statement.' },
  { num: '02', title: 'Payment verification', desc: 'Review references and payment proof before confirming a payment.' },
  { num: '03', title: 'Digital receipts', desc: 'Issue a professional receipt automatically after verification.' },
  { num: '04', title: 'Payment history', desc: 'Find every paid, pending, or overdue bill without searching through messages.' },
]

function Features() {
  return (
    <section className="py-20 bg-surface">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">Built for clarity</p>
        <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight mt-4 max-w-[520px]">Everything you need to manage rent</h2>
        <p className="text-[15px] text-text-secondary mt-2 mb-8">One dependable record for every charge, payment, and receipt.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-border mt-4">
          {features.map((f, i) => (
            <div key={f.num} className={`p-6 flex flex-col gap-3 ${i < features.length - 1 ? 'border-r border-border max-sm:border-r-0 max-sm:border-b max-lg:even:border-r-0' : ''}`}>
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">{f.num}</span>
              <h3 className="text-[15px] font-semibold">{f.title}</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Steps ──────────────────────────────────────────────────────────────── */
const steps = [
  { label: 'Create property',  desc: 'Add your property and define each unit.' },
  { label: 'Send invitation',  desc: 'Invite your renter via email — they accept with one click.' },
  { label: 'Generate bill',    desc: 'Bundle rent and utilities into a single monthly statement.' },
  { label: 'Renter pays',      desc: 'Renter transfers via eSewa, Fonepay, or bank and submits proof.' },
  { label: 'Verify payment',   desc: 'Confirm the reference — a receipt is issued automatically.' },
]

function Steps() {
  const sectionRef = useRef(null)
  const [active, setActive] = useState(-1)   // -1 = nothing lit yet

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        // Drive step activation off scroll position within the section
        const onScroll = () => {
          const rect = el.getBoundingClientRect()
          const windowH = window.innerHeight
          // progress: 0 when section top hits bottom of viewport, 1 when section bottom hits top
          const progress = Math.max(0, Math.min(1,
            (windowH - rect.top) / (windowH + rect.height)
          ))
          // map progress → which step is active (0-indexed, -1 = none)
          const idx = Math.round(progress * (steps.length - 1) * 1.6) - 1
          setActive(Math.min(steps.length - 1, idx))
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        return () => window.removeEventListener('scroll', onScroll)
      },
      { threshold: 0.05 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24 bg-bg" id="how-it-works" ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* Left — animated stepper card */}
        <div
          className="rounded-2xl p-8 border border-[#c8ddd2]"
          style={{ background: 'linear-gradient(135deg, #f4f8f5 0%, #eaf2ed 100%)' }}
        >
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent mb-6">
            A simple monthly rhythm
          </p>

          {/* Progress bar row */}
          <div className="flex items-center mb-8">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full text-[13px] font-semibold flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                    i <= active
                      ? 'bg-primary text-white shadow-md scale-110'
                      : 'bg-white text-text-muted border-2 border-border-dark'
                  }`}
                >
                  {i <= active ? (
                    // checkmark for completed past steps, number for active
                    i < active ? (
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    ) : (i + 1)
                  ) : (i + 1)}
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1 overflow-hidden rounded-full bg-border-dark">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: i < active ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step detail cards */}
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  i === active
                    ? 'bg-white border border-[#c8ddd2] shadow-sm'
                    : i < active
                    ? 'opacity-50'
                    : 'opacity-30'
                }`}
              >
                <span className={`mt-0.5 text-[11px] font-bold shrink-0 ${i <= active ? 'text-accent' : 'text-text-muted'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className={`text-[13px] font-semibold leading-snug ${i <= active ? 'text-text' : 'text-text-muted'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[12px] leading-relaxed mt-0.5 ${i <= active ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — heading */}
        <div>
          <h2 className="text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-right">
            From property to paid<br />in five steps
          </h2>
          <p className="text-[15px] text-text-secondary mt-4 leading-relaxed text-right">
            A repeatable rhythm every month — no chasing messages, no lost screenshots.
          </p>
        </div>

      </div>
    </section>
  )
}

/* ─── Roles ──────────────────────────────────────────────────────────────── */
function Roles() {
  return (
    <section className="py-20 bg-surface">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-16 items-stretch">
        <div className="flex flex-col gap-4" id="landlords">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">For landlords</p>
          <h2 className="text-3xl lg:text-4xl font-medium leading-tight tracking-tight">Know exactly what has been paid.</h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-[360px]">
            Manage one room or fifty units with a consistent billing and verification process.
          </p>
          <ul className="flex flex-col gap-2">
            {['Property and tenant records', 'Recurring utility charges', 'Pending and overdue tracking'].map((item) => (
              <li key={item} className="text-sm text-text-secondary flex items-center gap-2">
                <span className="text-accent font-semibold text-[13px]">✓</span> {item}
              </li>
            ))}
          </ul>
          <Link to="/register" className="self-start mt-auto pt-6 border-[1.5px] border-border-dark text-text px-4 py-2 rounded-md text-[13px] font-medium hover:bg-surface-muted hover:border-text-secondary transition-all">
            Explore landlord view
          </Link>
        </div>

        <div className="hidden lg:block w-px bg-border self-stretch" />

        <div className="flex flex-col gap-4" id="renters">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">For renters</p>
          <h2 className="text-3xl lg:text-4xl font-medium leading-tight tracking-tight">Understand every rupee you owe.</h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-[360px]">
            See a full bill breakdown, pay through familiar methods, and keep verified receipts.
          </p>
          <ul className="flex flex-col gap-2">
            {['Clear bill breakdowns', 'eSewa, Fonepay, or bank transfer', 'Receipts available anytime'].map((item) => (
              <li key={item} className="text-sm text-text-secondary flex items-center gap-2">
                <span className="text-accent font-semibold text-[13px]">✓</span> {item}
              </li>
            ))}
          </ul>
          <Link to="/register" className="self-start mt-auto pt-6 border-[1.5px] border-border-dark text-text px-4 py-2 rounded-md text-[13px] font-medium hover:bg-surface-muted hover:border-text-secondary transition-all">
            Explore renter view
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-bg-dark py-8">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 bg-white/15 text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
          <span className="text-[15px] font-semibold text-white">GharPay</span>
        </div>
        <p className="flex-1 text-[13px] text-white/50">Rent and bill management built for everyday Nepal.</p>
        <Link to="/register" className="bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">Create your account</Link>
      </div>
    </footer>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <Steps />
      <Roles />
      <Footer />
    </div>
  )
}
