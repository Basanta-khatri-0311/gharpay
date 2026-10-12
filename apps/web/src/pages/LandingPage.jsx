import { Link } from 'react-router-dom'

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
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
          <a href="#how-it-works" className="text-[14px] text-text-secondary hover:text-text transition-colors">How it works</a>
          <a href="#landlords" className="text-[14px] text-text-secondary hover:text-text transition-colors">For landlords</a>
          <a href="#renters" className="text-[14px] text-text-secondary hover:text-text transition-colors">For renters</a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link to="/login" className="text-[14px] font-medium text-text-secondary hover:text-text transition-colors px-3 py-2">Sign in</Link>
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
        <div className="hidden lg:block bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
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
  'Create property',
  'Send invitation',
  'Generate bill',
  'Renter pays',
  'Verify payment',
]

function Steps() {
  return (
    <section className="py-20 bg-bg" id="how-it-works">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">A simple monthly rhythm</p>
          <div className="flex items-center mt-8">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="w-8 h-8 rounded-full bg-primary text-white text-[13px] font-semibold flex items-center justify-center shrink-0 z-10">{i + 1}</div>
                {i < steps.length - 1 && <div className="flex-1 h-[1.5px] bg-border-dark" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((step, i) => (
              <span key={i} className={`text-xs text-text-secondary font-medium text-center ${i < steps.length - 1 ? 'flex-1' : 'min-w-[80px] flex-none'}`}>{step}</span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-right">
            From property to paid in five steps
          </h2>
        </div>
      </div>
    </section>
  )
}

/* ─── Roles ──────────────────────────────────────────────────────────────── */
function Roles() {
  return (
    <section className="py-20 bg-surface">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-16">
        <div className="flex flex-col gap-4" id="landlords">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">For landlords</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">Know exactly what has been paid.</h2>
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
          <Link to="/register" className="self-start mt-4 border-[1.5px] border-border-dark text-text px-4 py-2 rounded-md text-[13px] font-medium hover:bg-surface-muted hover:border-text-secondary transition-all">
            Explore landlord view
          </Link>
        </div>

        <div className="hidden lg:block w-px bg-border" />

        <div className="flex flex-col gap-4" id="renters">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent">For renters</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">Understand every rupee you owe.</h2>
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
          <Link to="/register" className="self-start mt-4 border-[1.5px] border-border-dark text-text px-4 py-2 rounded-md text-[13px] font-medium hover:bg-surface-muted hover:border-text-secondary transition-all">
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
