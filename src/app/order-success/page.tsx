"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OrderSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Separate effect for navigation
    if (countdown === 0) {
      router.push("/products")
    }

    return () => clearInterval(timer)
  }, [countdown, router])

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      paddingTop: "2rem",
      paddingBottom: "2rem",
      paddingLeft: "2rem",
      paddingRight: "2rem",
      backgroundColor: "#f9f9f9"
    }}>
      <div style={{ 
        maxWidth: "600px", 
        width: "100%",
        backgroundColor: "white",
        border: "3px solid black",
        padding: "3rem"
      }}>
        {/* Success Icon */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ 
            fontSize: "4rem", 
            marginBottom: "1rem",
            animation: "scaleIn 0.5s ease-out"
          }}>
            ✓
          </div>
          <style jsx>{`
            @keyframes scaleIn {
              from { transform: scale(0); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>

        {/* Main Message */}
        <h1 style={{ 
          fontSize: "2rem", 
          fontWeight: 900, 
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "1rem"
        }}>
          Order Placed Successfully!
        </h1>

        <p style={{ 
          fontSize: "1rem", 
          color: "#555", 
          textAlign: "center",
          lineHeight: 1.7,
          marginBottom: "2rem"
        }}>
          Thank you for your order! We've received it and will contact you shortly to confirm the details.
        </p>

        {/* What's Next */}
        <div style={{ 
          backgroundColor: "#f5f5f5", 
          paddingTop: "1.5rem",
          paddingBottom: "1.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{ 
            fontSize: "0.9rem", 
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "1rem",
            letterSpacing: "0.05em"
          }}>
            What Happens Next?
          </h3>
          <ol style={{ 
            margin: 0,
            paddingLeft: "1.25rem",
            fontSize: "0.875rem",
            color: "#666",
            lineHeight: 1.8
          }}>
            <li>We'll call you within 24 hours to confirm your order</li>
            <li>Your order will be prepared and packed</li>
            <li>We'll ship it to your address</li>
            <li>Payment on delivery (Cash on Delivery)</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "1rem"
        }}>
          <a
            href="https://wa.me/8801935962421?text=Hi!%20I%20just%20placed%20an%20order"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "1rem",
              backgroundColor: "#25D366",
              color: "white",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            📱 Contact Us on WhatsApp
          </a>

          <a
            href="/products"
            style={{
              display: "block",
              padding: "1rem",
              backgroundColor: "black",
              color: "white",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            Continue Shopping
          </a>

          <p style={{ 
            textAlign: "center", 
            fontSize: "0.75rem", 
            color: "#999",
            marginTop: "0.5rem"
          }}>
            {countdown > 0 ? `Redirecting to products in ${countdown} seconds...` : "Redirecting..."}
          </p>
        </div>

        {/* Order Tracking Info */}
        <div style={{ 
          marginTop: "2rem",
          paddingTop: "1rem",
          paddingBottom: "1rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          borderTop: "1px solid #e0e0e0",
          textAlign: "center"
        }}>
          <p style={{ 
            fontSize: "0.75rem", 
            color: "#999",
            marginBottom: "0.5rem"
          }}>
            Need help with your order?
          </p>
          <p style={{ 
            fontSize: "0.875rem", 
            fontWeight: 600
          }}>
            Call: +880 1935-962421
          </p>
        </div>
      </div>
    </div>
  )
}
