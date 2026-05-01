"use client"

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: "#111",
      color: "white",
      paddingTop: "3rem",
      paddingBottom: "2rem",
      marginTop: "4rem"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
          paddingBottom: "2rem",
          borderBottom: "1px solid #333"
        }}>
          {/* Brand */}
          <div>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              marginBottom: "1rem",
              textTransform: "uppercase"
            }}>
              FLEXTREME
            </h3>
            <p style={{
              color: "#999",
              fontSize: "0.9rem",
              lineHeight: 1.6
            }}>
              Push Harder. Look Sharper.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}>
              Quick Links
            </h4>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}>
              <li>
                <a href="/products" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>
                  Products
                </a>
              </li>
              <li>
                <a href="/about" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}>
              Contact
            </h4>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}>
              <li style={{ color: "#999", fontSize: "0.9rem" }}>
                Email: info@flextreme.com
              </li>
              <li style={{ color: "#999", fontSize: "0.9rem" }}>
                Phone: +880 1XXX-XXXXXX
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          paddingTop: "2rem",
          textAlign: "center"
        }}>
          <p style={{
            color: "#666",
            fontSize: "0.85rem"
          }}>
            © {new Date().getFullYear()} Flextreme. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
