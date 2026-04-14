"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { CartButton } from "@/components/ui/Cart"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/reviews", label: "Reviews" },
    { href: "/about", label: "About" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/delivery", label: "Delivery" },
    { href: "/contact", label: "Contact" },
    { href: "/flex-ai", label: "✦ Flex AI", special: true },
  ]

  const isTransparent = isHome && !scrolled
  const bgColor = isTransparent ? "rgba(0,0,0,0)" : "var(--theme-primary, rgba(0,0,0,0.97))"
  const borderColor = isTransparent ? "transparent" : "rgba(255,255,255,0.08)"

  return (
    <nav className="navbar-fixed" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: bgColor, backdropFilter: isTransparent ? "none" : "blur(12px)", transition: "all 0.3s ease", borderBottom: "1px solid " + borderColor }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
          <img src="/logo-transparent.png" alt="Flextreme" style={{ width: "36px", height: "36px", objectFit: "contain", filter: "invert(1)", display: "block" }} />
          <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "white", letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1 }}>
            FLEX<span style={{ color: "rgba(255,255,255,0.4)" }}>TREME</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flex: 1, justifyContent: "center" }} className="hidden-mobile">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={(link as any).special ? {
              color: "black", textDecoration: "none", fontSize: "0.72rem", fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
              backgroundColor: "white", padding: "0.35rem 0.9rem", borderRadius: "2px",
              transition: "all 0.2s", display: "inline-block"
            } : {
              color: pathname === link.href ? "white" : "rgba(255,255,255,0.65)", textDecoration: "none",
              fontSize: "0.78rem", fontWeight: pathname === link.href ? 700 : 500, letterSpacing: "0.1em",
              textTransform: "uppercase", borderBottom: pathname === link.href ? "1px solid white" : "1px solid transparent",
              paddingBottom: "2px", transition: "all 0.2s", whiteSpace: "nowrap"
            }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right — Cart only */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }} className="hidden-mobile">
          <CartButton />
        </div>

        {/* Mobile: cart + hamburger */}
        <div style={{ display: "none", alignItems: "center", gap: "0.5rem" }} className="show-mobile">
          <CartButton />
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: "none", border: "none", color: "white", cursor: "none", padding: "0.5rem" }} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div style={{ backgroundColor: "var(--theme-primary, black)", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} style={(link as any).special ? {
              color: "black", backgroundColor: "white", textDecoration: "none", fontSize: "1rem",
              fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.75rem 1.5rem", textAlign: "center" as const, display: "block", marginTop: "0.5rem"
            } : {
              color: pathname === link.href ? "white" : "rgba(255,255,255,0.7)", textDecoration: "none",
              fontSize: "1rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              {link.label}
            </Link>
          ))}
          <Link href="/products" onClick={() => setIsOpen(false)} style={{ backgroundColor: "var(--theme-accent, white)", color: "var(--theme-primary, black)", padding: "1rem", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", textAlign: "center", display: "block" }}>
            Browse Products
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
