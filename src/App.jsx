import { useState } from "react";
import { T } from "./styles/theme.js";
import { useBreakpoint } from "./hooks/useBreakpoint.js";
import Dashboard from "./pages/Dashboard.jsx";

const NAV_ITEMS = [
  { icon: "⬡", label: "Dashboard",    active: true  },
  { icon: "◈", label: "CDU Analysis", active: false },
  { icon: "◉", label: "VDU",          active: false, dim: true },
  { icon: "⬡", label: "Preheat Train",active: false, dim: true },
  { icon: "⊞", label: "Reports",      active: false, dim: true },
];

export default function App() {
  const { isMobile } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closDrawer = () => setDrawerOpen(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: T.bg }}>

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header style={{
          position:     "sticky",
          top:          0,
          zIndex:       200,
          display:      "flex",
          alignItems:   "center",
          gap:          "12px",
          padding:      "0 16px",
          height:       "52px",
          background:   T.surface,
          borderBottom: `1px solid ${T.border}`,
          flexShrink:   0,
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              background:   "none",
              border:       `1px solid ${T.border2}`,
              borderRadius: T.r4,
              color:        T.textMute,
              fontSize:     "18px",
              lineHeight:   1,
              padding:      "5px 9px",
              cursor:       "pointer",
            }}>
            ☰
          </button>
          <div>
            <div style={{ fontFamily: T.fontMono, fontSize: "15px", fontWeight: 700, color: T.teal, letterSpacing: "0.02em", lineHeight: 1 }}>
              RefineOpt
            </div>
            <div style={{ fontSize: "9px", color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              CDU Intelligence
            </div>
          </div>
        </header>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── Desktop sidebar ── */}
        {!isMobile && (
          <aside style={{
            width:        "200px",
            flexShrink:   0,
            background:   T.surface,
            borderRight:  `1px solid ${T.border}`,
            display:      "flex",
            flexDirection:"column",
          }}>
            <SidebarContents />
          </aside>
        )}

        {/* ── Mobile drawer overlay ── */}
        {isMobile && drawerOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={closDrawer}
              style={{
                position:   "fixed",
                inset:      0,
                zIndex:     300,
                background: "rgba(0,0,0,0.6)",
              }}
            />
            {/* Drawer panel */}
            <aside style={{
              position:     "fixed",
              top:          0,
              left:         0,
              bottom:       0,
              zIndex:       400,
              width:        "240px",
              background:   "#0d1117",
              borderRight:  `1px solid ${T.border2}`,
              display:      "flex",
              flexDirection:"column",
            }}>
              {/* Close button row */}
              <div style={{
                display:      "flex",
                alignItems:   "center",
                justifyContent:"space-between",
                padding:      "14px 16px",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: "15px", fontWeight: 700, color: T.teal }}>RefineOpt</div>
                  <div style={{ fontSize: "9px", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>CDU Intelligence</div>
                </div>
                <button
                  onClick={closDrawer}
                  aria-label="Close menu"
                  style={{
                    background: "none", border: "none",
                    color: T.textMute, fontSize: "20px", lineHeight: 1,
                    cursor: "pointer", padding: "4px",
                  }}>
                  ✕
                </button>
              </div>
              <SidebarContents onNavClick={closDrawer} />
            </aside>
          </>
        )}

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

function SidebarContents({ onNavClick }) {
  return (
    <>
      {/* Logo — desktop only (mobile shows in header) */}
      <div style={{
        padding:     "18px 20px 14px",
        borderBottom:`1px solid ${T.border}`,
        display:     onNavClick ? "none" : "block",   // hidden in mobile drawer (already in drawer header)
      }}>
        <div style={{ fontFamily: T.fontMono, fontSize: "16px", fontWeight: 700, color: T.teal, letterSpacing: "0.02em" }}>
          RefineOpt
        </div>
        <div style={{ fontSize: "10px", color: T.textDim, marginTop: "2px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          CDU Intelligence
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: "8px 0", flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <div
            key={item.label}
            onClick={item.dim ? undefined : onNavClick}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "10px",
              padding:    "10px 20px",
              color:      item.active ? T.teal : item.dim ? T.textDim : T.textMute,
              background: item.active ? T.tealDim : "transparent",
              borderLeft: item.active ? `2px solid ${T.teal}` : "2px solid transparent",
              fontSize:   "13px",
              cursor:     item.dim ? "default" : "pointer",
              minHeight:  "44px",
            }}>
            <span style={{ fontSize: "14px" }}>{item.icon}</span>
            {item.label}
            {item.dim && (
              <span style={{ marginLeft: "auto", fontSize: "9px", color: T.textDim, border: `1px solid ${T.border}`, borderRadius: "3px", padding: "1px 4px" }}>
                soon
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: "10px", color: T.textDim, lineHeight: 1.6 }}>
          Dataset<br />
          <span style={{ color: T.textMute }}>CDU · 2022–2023</span>
        </div>
      </div>
    </>
  );
}
