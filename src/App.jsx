import { T } from "./styles/theme.js";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      {/* Sidebar */}
      <aside style={{
        width:        "200px",
        flexShrink:   0,
        background:   T.surface,
        borderRight:  `1px solid ${T.border}`,
        display:      "flex",
        flexDirection:"column",
        padding:      "0",
      }}>
        {/* Logo */}
        <div style={{
          padding:     "18px 20px 14px",
          borderBottom:`1px solid ${T.border}`,
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
          {[
            { icon: "⬡", label: "Dashboard",   active: true },
            { icon: "◈", label: "CDU Analysis", active: false },
            { icon: "◉", label: "VDU",           active: false, dim: true },
            { icon: "⬡", label: "Preheat Train", active: false, dim: true },
            { icon: "⊞", label: "Reports",       active: false, dim: true },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "10px",
                padding:    "8px 20px",
                color:      item.active ? T.teal : item.dim ? T.textDim : T.textMute,
                background: item.active ? T.tealDim : "transparent",
                borderLeft: item.active ? `2px solid ${T.teal}` : "2px solid transparent",
                fontSize:   "13px",
                cursor:     item.dim ? "default" : "pointer",
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
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Dashboard />
      </main>
    </div>
  );
}
