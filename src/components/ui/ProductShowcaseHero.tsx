"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "./ProductShowcaseHero.css"

interface Product {
  image: string
  label?: string
  slug?: string
  color?: string
  circleColor?: string
  glowEnabled?: boolean
  glowPulse?: boolean
}

interface Particle {
  x: number
  y: number
  homeX: number
  homeY: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  size: number
  opacity: number
  baseOpacity: number
  z: number
  index: number
  driftRadius: number
  driftSpeed: number
  driftPhase: number
}

interface GlowSettings {
  enabled: boolean
  size: number
  opacity: number
  blur: number
  pulse: boolean
  color?: string
}

interface ProductShowcaseHeroProps {
  products: Product[]
  heading?: string
  subtext?: string
  primaryCTA?: string
  showPrimaryCTA?: boolean
  glowSettings?: GlowSettings
}

const AUTO_ROTATE_DELAY_MS = 3000
const POINTER_IDLE_DELAY_MS = 3000

export default function ProductShowcaseHero({
  products = [],
  heading,
  subtext,
  primaryCTA = "Buy Now",
  showPrimaryCTA = true,
  glowSettings = { enabled: true, size: 520, opacity: 0.65, blur: 90, pulse: false },
}: ProductShowcaseHeroProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next")
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const productZoneRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const productCenterRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | null>(null)
  const heroRef = useRef<HTMLElement>(null)
  const isAnimatingRef = useRef(false)
  const isMobileRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickSuppressRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragDeltaRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)

  const defaultProducts: Product[] = [
    { image: "/compression 01.png", label: "Ultra Flex Half Sleeve", color: "#FF6B6B", circleColor: "#FF6B6B", glowEnabled: true, glowPulse: false },
    { image: "/compression 02.png", label: "Ultra Flex Sleeveless", color: "#4ECDC4", circleColor: "#4ECDC4", glowEnabled: true, glowPulse: false },
    { image: "/compression 03.png", label: "Ultra Flex Compression", color: "#95E1D3", circleColor: "#95E1D3", glowEnabled: true, glowPulse: false }
  ]

  const displayProducts = products.length > 0 ? products : defaultProducts
  const totalProducts = displayProducts.length
  const activeProduct = displayProducts[currentIndex]
  const activeGlow = glowSettings.enabled && activeProduct?.glowEnabled !== false
  const mobileGlowOpacity = isMobile ? glowSettings.opacity * 0.7 : glowSettings.opacity
  const particleColor = "#ffffff"
  const activeGlowColor = activeProduct?.circleColor || activeProduct?.color || "#ffffff"

  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const normalized = hex.replace("#", "").trim()
    const value = normalized.length === 3
      ? normalized.split("").map(char => char + char).join("")
      : normalized
    const parsed = parseInt(value, 16)
    const safeAlpha = Math.max(0, Math.min(1, alpha))
    if (!Number.isFinite(parsed) || value.length !== 6) return `rgba(255, 255, 255, ${safeAlpha})`
    const r = (parsed >> 16) & 255
    const g = (parsed >> 8) & 255
    const b = parsed & 255
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
  }, [])

  const pauseAfterInteraction = useCallback(() => {
    setIsPaused(true)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), POINTER_IDLE_DELAY_MS)
  }, [])

  const slideTo = useCallback((targetIndex: number, direction: "next" | "prev") => {
    if (totalProducts <= 1 || targetIndex === currentIndex || isAnimatingRef.current) return
    const normalizedTarget = (targetIndex + totalProducts) % totalProducts
    isAnimatingRef.current = true
    setPreviousIndex(currentIndex)
    setSlideDirection(direction)
    setCurrentIndex(normalizedTarget)
    setIsAnimating(true)

    // Instant velocity kick — push ALL particles toward product center (whole window effect)
    const product = productCenterRef.current
    const canvas = canvasRef.current
    const isMob = isMobileRef.current
    
    particlesRef.current.forEach(particle => {
      const dx = product.x - particle.x
      const dy = product.y - particle.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      
      // Product changes create a visible wave without pulling particles out of their zones.
      const maxDist = canvas ? canvas.width * 0.9 : 1000
      const influence = 1 - Math.min(dist / maxDist, 1)

      const kick = isMob ? 1.2 : 1.8

      particle.vx += (dx / dist) * kick * (0.2 + influence * 0.45) * (1 - particle.z * 0.35)
      particle.vy += (dy / dist) * kick * (0.2 + influence * 0.45) * (1 - particle.z * 0.35)
    })

    // Sustained burst force for 800ms (longer for whole window effect)
    transitionBurstRef.current = 1
    burstStartTimeRef.current = performance.now()
    window.setTimeout(() => { transitionBurstRef.current = 0 }, 800)

    window.setTimeout(() => {
      isAnimatingRef.current = false
      setIsAnimating(false)
      setPreviousIndex(null)
    }, 900)
  }, [currentIndex, totalProducts])

  const nextSlide = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalProducts
    slideTo(nextIndex, "next")
  }, [currentIndex, slideTo, totalProducts])

  const prevSlide = useCallback(() => {
    const prevIndex = (currentIndex - 1 + totalProducts) % totalProducts
    slideTo(prevIndex, "prev")
  }, [currentIndex, slideTo, totalProducts])

  const pauseForPointerActivity = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    setIsPaused(true)
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false)
      if (!isAnimatingRef.current && pointerIdRef.current === null) nextSlide()
    }, POINTER_IDLE_DELAY_MS)
  }, [nextSlide])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    isAnimatingRef.current = isAnimating
  }, [isAnimating])

  useEffect(() => {
    isMobileRef.current = isMobile
  }, [isMobile])

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  // Track mouse/touch for particle repulsion
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    const imagePromises = displayProducts.map(product => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = product.image
        img.onload = resolve
        img.onerror = reject
      })
    })

    Promise.all(imagePromises)
      .then(() => setImagesLoaded(true))
      .catch(() => setImagesLoaded(true))
  }, [displayProducts])

  const transitionBurstRef = useRef(0) // stores burst strength, decays over time
  const burstStartTimeRef = useRef(0)

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const isMob = isMobileRef.current
    const particleCount = isMob ? 120 : 900
    const particles: Particle[] = []
    const width = canvas.width
    const height = canvas.height

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const z = Math.random()
      const speedScale = 1.05 - z * 0.55
      const brightness = Math.random() > 0.78 ? 1.2 : 1
      const sizeBias = Math.random() ** 1.7

      particles.push({
        x,
        y,
        homeX: x,
        homeY: y,
        prevX: x,
        prevY: y,
        vx: (Math.random() - 0.5) * 0.26 * speedScale,
        vy: (Math.random() - 0.5) * 0.26 * speedScale,
        size: (sizeBias * 1.8 + 0.65) * brightness,
        opacity: (Math.random() * 0.25 + 0.18) * brightness,
        baseOpacity: (Math.random() * 0.25 + 0.18) * brightness,
        z,
        index: i,
        driftRadius: (isMob ? 6 : 10) + Math.random() * (isMob ? 12 : 22),
        driftSpeed: 0.00045 + Math.random() * 0.00075,
        driftPhase: Math.random() * Math.PI * 2,
      })
    }
    particlesRef.current = particles
  }, [])

  const syncProductCenter = useCallback(() => {
    const canvas = canvasRef.current
    const productZone = productZoneRef.current
    if (!canvas || !productZone) return

    const canvasRect = canvas.getBoundingClientRect()
    const productRect = productZone.getBoundingClientRect()

    productCenterRef.current = {
      x: productRect.left + productRect.width / 2 - canvasRect.left,
      y: productRect.top + productRect.height * 0.42 - canvasRect.top,
    }
  }, [])

  const updateParticles = useCallback((time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.width || window.innerWidth
    const height = canvas.height || window.innerHeight
    const mouse = mouseRef.current
    const isMob = isMobileRef.current
    const burstAge = Math.max(0, time - burstStartTimeRef.current)
    const burst = transitionBurstRef.current * Math.max(0, 1 - burstAge / 800)

    particlesRef.current.forEach((particle) => {
      particle.prevX = particle.x
      particle.prevY = particle.y

      const driftTime = time * particle.driftSpeed + particle.driftPhase
      const driftX = Math.cos(driftTime) * particle.driftRadius
      const driftY = Math.sin(driftTime * 1.37) * particle.driftRadius * 0.72
      let targetX = particle.homeX + driftX
      let targetY = particle.homeY + driftY
      const product = productCenterRef.current
      const productDx = product.x - particle.x
      const productDy = product.y - particle.y
      const productDist = Math.sqrt(productDx * productDx + productDy * productDy) || 1
      const burstReach = isMob ? 32 : Math.min(150, Math.max(90, width * 0.055))

      if (burst > 0) {
        const homeToProductX = product.x - particle.homeX
        const homeToProductY = product.y - particle.homeY
        const homeToProductDist = Math.sqrt(homeToProductX * homeToProductX + homeToProductY * homeToProductY) || 1
        const productInfluence = 1 - Math.min(homeToProductDist / Math.max(width, height), 1)
        const burstOffset = burstReach * burst * (0.25 + productInfluence * 0.75) * (1 - particle.z * 0.35)

        targetX += (homeToProductX / homeToProductDist) * burstOffset
        targetY += (homeToProductY / homeToProductDist) * burstOffset
      }

      const returnStrength = isMob ? 0.028 : 0.022
      particle.vx += (targetX - particle.x) * returnStrength
      particle.vy += (targetY - particle.y) * returnStrength

      const mouseDx = particle.x - mouse.x
      const mouseDy = particle.y - mouse.y
      const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy) || 1
      const repulsionRadius = isMob ? 95 : 155

      if (mouseDist < repulsionRadius) {
        const force = (1 - mouseDist / repulsionRadius) * (isMob ? 0.55 : 0.9)
        particle.vx += (mouseDx / mouseDist) * force
        particle.vy += (mouseDy / mouseDist) * force
      }

      particle.vx += Math.sin(time * 0.0012 + particle.index) * 0.004
      particle.vy += Math.cos(time * 0.001 + particle.index * 0.7) * 0.004
      particle.vx *= 0.88
      particle.vy *= 0.88

      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < -24 || particle.x > width + 24 || particle.y < -24 || particle.y > height + 24) {
        particle.x = particle.homeX
        particle.y = particle.homeY
        particle.vx = 0
        particle.vy = 0
      }

      const proximity = Math.max(0, 1 - productDist / Math.max(width, height))
      particle.opacity = Math.min(0.72, particle.baseOpacity + proximity * 0.08 + burst * 0.12)
    })
  }, [])

  const renderParticles = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = "lighter"

    particlesRef.current.forEach((particle) => {
      const size = particle.size * (1.15 - particle.z * 0.45)
      const alpha = Math.max(0, Math.min(1, particle.opacity))

      ctx.beginPath()
      ctx.fillStyle = hexToRgba(particleColor, alpha)
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
      ctx.fill()

      const travel = Math.hypot(particle.x - particle.prevX, particle.y - particle.prevY)
      if (travel > 0.8) {
        ctx.beginPath()
        ctx.strokeStyle = hexToRgba(particleColor, alpha * 0.34)
        ctx.lineWidth = Math.max(0.4, size * 0.34)
        ctx.moveTo(particle.prevX, particle.prevY)
        ctx.lineTo(particle.x, particle.y)
        ctx.stroke()
      }
    })

    ctx.globalCompositeOperation = "source-over"
  }, [hexToRgba])

  const updateGlow = useCallback((time: number) => {
    const glow = glowRef.current
    if (!glow) return

    const pulseEnabled = glowSettings.pulse || activeProduct?.glowPulse
    const pulse = pulseEnabled ? 1 + Math.sin(time * 0.003) * 0.045 : 1
    const opacity = activeGlow ? mobileGlowOpacity : 0

    glow.style.opacity = `${opacity}`
    glow.style.transform = `translateY(-18%) scale(${pulse})`
  }, [activeGlow, activeProduct?.glowPulse, glowSettings.pulse, mobileGlowOpacity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imagesLoaded) return
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = canvas.offsetHeight || window.innerHeight
      syncProductCenter()
      initParticles()
    }
    resize()
    window.addEventListener('resize', resize)
    const animateParticles = (time: number) => {
      syncProductCenter()
      updateParticles(time)
      renderParticles()
      updateGlow(time)
      animationFrameRef.current = requestAnimationFrame(animateParticles)
    }
    animationFrameRef.current = requestAnimationFrame(animateParticles)
    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [imagesLoaded, initParticles, renderParticles, syncProductCenter, updateGlow, updateParticles])

  useEffect(() => {
    if (isPaused || isAnimating || totalProducts <= 1) return
    const timer = window.setTimeout(() => {
      nextSlide()
    }, AUTO_ROTATE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isAnimating, isPaused, nextSlide, totalProducts])

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest(".carousel-arrow")) return
    if (isAnimatingRef.current) return

    pointerIdRef.current = e.pointerId
    dragStartXRef.current = e.clientX
    dragDeltaRef.current = 0
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return
    dragDeltaRef.current = e.clientX - dragStartXRef.current
    if (Math.abs(dragDeltaRef.current) > 8) clickSuppressRef.current = true
  }, [])

  const openActiveProduct = useCallback(() => {
    if (clickSuppressRef.current) return
    const slug = activeProduct?.slug
    if (!slug) return
    // Handle both full URLs (https://...) and relative paths (/products/...)
    try {
      const url = new URL(slug)
      router.push(url.pathname)
    } catch {
      // It's already a relative path
      router.push(slug.startsWith('/') ? slug : '/' + slug)
    }
  }, [activeProduct?.slug, router])

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return

    const dragDelta = dragDeltaRef.current
    pointerIdRef.current = null
    setIsDragging(false)

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (Math.abs(dragDelta) > 50 && !isAnimatingRef.current) {
      pauseAfterInteraction()
      if (dragDelta < 0) nextSlide()
      else prevSlide()
      clickSuppressRef.current = true
    } else if (Math.abs(dragDelta) <= 8) {
      // It was a tap/click, not a drag — navigate to product
      clickSuppressRef.current = false
      openActiveProduct()
      return
    }

    window.setTimeout(() => {
      clickSuppressRef.current = false
    }, 100)
  }, [nextSlide, openActiveProduct, pauseAfterInteraction, prevSlide])

  const handleArrowClick = useCallback((direction: "next" | "prev") => {
    pauseAfterInteraction()
    if (direction === "next") nextSlide()
    else prevSlide()
  }, [nextSlide, pauseAfterInteraction, prevSlide])

  const defaultHeading = heading || "ULTRA FLEX\nENGINEERED TO FLEX.\nBUILT TO PERFORM."
  const defaultSubtext = subtext || "Performance wear that moves with you."
  const headingLines = defaultHeading.split('\n')
  const staticGlowOpacity = Math.max(0, Math.min(1, mobileGlowOpacity))

  return (
    <section
      ref={heroRef}
      className="cinematic-hero"
      onPointerMove={pauseForPointerActivity}
      onMouseLeave={pauseAfterInteraction}
    >
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          mixBlendMode: 'screen',
        }}
      />
      <div className="hero-fog" />

      <div className="hero-content">
        <div className="text-zone">
          <div className="headline-stack">
            {headingLines.map((line, i) => (
              <h1 key={i} className="headline">
                {line}
              </h1>
            ))}
          </div>

          <p className="subtext">{defaultSubtext}</p>

          {showPrimaryCTA && (
            <Link href="/products" className="cta-button">
              {primaryCTA}
            </Link>
          )}
        </div>

        <div
          ref={productZoneRef}
          className="product-zone"
          style={{ cursor: isDragging ? 'grabbing' : activeProduct?.slug ? 'pointer' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {activeGlow && (
            <div 
              ref={glowRef}
              className="product-glow"
              style={{
                width: `${glowSettings.size}px`,
                height: `${glowSettings.size}px`,
                filter: `blur(${glowSettings.blur}px)`,
                background: `radial-gradient(circle at center, ${hexToRgba(activeGlowColor, staticGlowOpacity)} 0%, ${hexToRgba(activeGlowColor, staticGlowOpacity * 0.4)} 30%, transparent 70%)`,
              }}
            />
          )}

          {/* All products - simultaneous animation */}
          {displayProducts.map((product, idx) => {
            const isActive = idx === currentIndex
            const isPrevious = idx === previousIndex
            
            let state = 'hidden'
            if (isActive) {
              state = isAnimating ? `entering-${slideDirection}` : 'active'
            } else if (isAnimating && isPrevious) {
              state = `exiting-${slideDirection}`
            }

            return (
              <div
                key={idx}
                className={`product-item ${state}`}
                onClick={isActive ? openActiveProduct : undefined}
                role={isActive && product.slug ? "button" : undefined}
                tabIndex={isActive && product.slug ? 0 : -1}
                onKeyDown={isActive ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    openActiveProduct()
                  }
                } : undefined}
              >
                <img 
                  src={product.image}
                  alt={product.label}
                  className="product-image"
                  draggable="false"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            )
          })}

          {/* Product name under product - ALWAYS SHOW */}
          <div className="product-name-label" key={currentIndex}>
            {displayProducts[currentIndex]?.label || 'NO NAME SET'}
          </div>

          <div className="carousel-arrows" aria-label="Product carousel controls">
            <button
              type="button"
              className="carousel-arrow left"
              aria-label="Previous product"
              onClick={() => handleArrowClick("prev")}
              disabled={isAnimating || totalProducts <= 1}
            >
              <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="carousel-arrow right"
              aria-label="Next product"
              onClick={() => handleArrowClick("next")}
              disabled={isAnimating || totalProducts <= 1}
            >
              <ChevronRight size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
