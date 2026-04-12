"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthenticated(true)
      else if (!isLoginPage) router.push("/admin/login")
      setLoading(false)
    })

    // Listen for auth changes (handles session refresh after navigation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true)
        setLoading(false)
      } else if (!isLoginPage) {
        setAuthenticated(false)
        setLoading(false)
        router.push("/admin/login")
      }
    })

    // Safety timeout — never show loading forever
    const timeout = setTimeout(() => setLoading(false), 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [isLoginPage, router])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontSize: "0.875rem", letterSpacing: "0.2em" }}>LOADING...</p>
    </div>
  )

  if (isLoginPage) return <>{children}</>
  if (!authenticated) return null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/orders", label: "Orders", icon: "📦" },
    { href: "/admin/products", label: "Products", icon: "👕" },
    { href: "/admin/stock", label: "Stock", icon: "📋" },
    { href: "/admin/logistics", label: "Logistics", icon: "🚚" },
    { href: "/admin/finance", label: "Finance", icon: "💰" },
    { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ]

  // Exact match first, then prefix — prevents /admin/orders matching /admin/orders AND /admin/orders/123
  const isActive = (href: string) => pathname === href || (pathname.startsWith(href + "/") && href !== "/admin")

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <style>{`
        .admin-desktop-nav { display: none; }
        @media (min-width: 900px) {
          .admin-desktop-nav { display: flex !important; }
          .admin-hamburger { display: none !important; }
        }
        /* Mobile: prevent any horizontal overflow */
        @media (max-width: 899px) {
          .admin-main-content { padding: 0.75rem 0.75rem !important; }
          .admin-main-content * { max-width: 100%; box-sizing: border-box; }
        }
      `}</style>

      {/* Top bar */}
      <nav style={{ backgroundColor: "black", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          {/* Hamburger */}
          <button
            className="admin-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <span style={{ display: "block", width: "22px", height: "2px", background: "white", transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ display: "block", width: "22px", height: "2px", background: "white", opacity: menuOpen ? 0 : 1, transition: "all 0.2s" }} />
            <span style={{ display: "block", width: "22px", height: "2px", background: "white", transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
          <span style={{ color: "white", fontWeight: 900, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "-0.02em" }}>FLEXTREME</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.2em" }}>Admin</span>
        </div>
        {/* Desktop nav */}
        <div className="admin-desktop-nav" style={{ alignItems: "center", gap: "0.2rem", overflowX: "auto" }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{ color: isActive(link.href) ? "white" : "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", padding: "0.3rem 0.55rem", backgroundColor: isActive(link.href) ? "rgba(255,255,255,0.15)" : "transparent", borderRadius: "4px", whiteSpace: "nowrap" }}>
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.6)", padding: "0.3rem 0.75rem", fontSize: "0.7rem", cursor: "pointer", textTransform: "uppercase", marginLeft: "0.5rem", whiteSpace: "nowrap" }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile slide-out drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 98 }} />
          <div style={{ position: "fixed", top: "56px", left: 0, bottom: 0, width: "260px", backgroundColor: "#111", zIndex: 99, overflowY: "auto" }}>
            <div style={{ padding: "0.5rem 0" }}>
              {navLinks.map(link => (
                /* Use a regular anchor tag to avoid any SPA routing issues on mobile */
                <a
                  key={link.href}
                  href={link.href}
                  onClick={e => { e.preventDefault(); setMenuOpen(false); router.push(link.href) }}
                  style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1.25rem", color: isActive(link.href) ? "white" : "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.95rem", fontWeight: isActive(link.href) ? 700 : 400, backgroundColor: isActive(link.href) ? "rgba(255,255,255,0.08)" : "transparent", borderLeft: isActive(link.href) ? "3px solid white" : "3px solid transparent" }}
                >
                  <span style={{ fontSize: "1.2rem", width: "28px", textAlign: "center" }}>{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "1rem 1.25rem" }}>
              <button onClick={handleLogout} style={{ width: "100%", padding: "0.75rem", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", textAlign: "left", textTransform: "uppercase" }}>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      <main className="admin-main-content" style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto", overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  )
}
