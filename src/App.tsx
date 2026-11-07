import { useState, useEffect } from "react"
import { FileView } from "./components/TabViews"
import { HomeView } from "./components/TabViews"
import { IntakeView } from "./components/TabViews"
import { TriageView } from "./components/TabViews"
import { InvestigationView } from "./components/TabViews"
import { ResolutionView } from "./components/TabViews"
import { AnalyticsView } from "./components/TabViews"
import { QualityView } from "./components/TabViews"
import { IndustrialAutomationView } from "./components/TabViews"
import { AddInsView } from "./components/TabViews"
import { ViewView } from "./components/TabViews"
import { HelpView } from "./components/TabViews"
import DescriptiveTab from "./components/DescriptiveTab.jsx";

const RIBBON: Record<string,string[]> = {
  Descriptive: ["Frequencies","Descriptives","Explore","Crosstabs","Ratio","P-P Plots","Q-Q Plots"],
  SPSS: ["Frequencies","Descriptives","Explore","Crosstabs","Means","One-Sample T","Independent T","Paired T","One-Way ANOVA"],
  "Compare Means": ["Means","One-Sample T","Independent T","Paired T","One-Way ANOVA"],
  "General Linear": ["Univariate GLM","Multivariate MANOVA","Repeated Measures","ANCOVA"],
  Regression: ["Linear","Multiple","Binary Logistic","Multinomial","Ordinal","Probit","Nonlinear","2SLS"],
  Classify: ["TwoStep","K-Means","Hierarchical","Discriminant"],
  "Dimension Reduction": ["Factor","PCA"],
  Nonparametric: ["Chi-square","Binomial","Runs","K-S","Mann-Whitney","Kruskal-Wallis"],
  "Time Series": ["Sequence","ACF","PACF","Spectral"],
  "EViews": ["ADF","PP","KPSS","DF-GLS"],
  "Unit Root": ["ADF = -2.34","KPSS","DF-GLS","Ng-Perron","Zivot-Andrews","ERS","Δy = α + βt + γy + ΣδΔy + ε"],
  Cointegration: ["Engle-Granger","Johansen","Phillips-Ouliaris"],
  "VARCM": ["VAR","VECM","Granger Causality","Toda-Yamamoto","IRF"],
  "GARCH": ["ARCH LM","GARCH","TGARCH","EGARCH","GJR","ARMA","ARIMA"],
  Pengineering: ["CPK","OEE","MTBF","MTTR","FMEA","SPC"],
  "World 500+": ["Jarque-Bera","White","Breusch-Pagan","Durbin-Watson","500+ Formulas"]
}

export default function App(){
  const [open, setOpen] = useState<string|null>(null)
  const [sel, setSel] = useState("CFO View WF94")
  const [activeTop, setActiveTop] = useState("ANALYTICS")
  const [activeAnalysis, setActiveAnalysis] = useState("ANALYTICS_HOME")
  const [showFilters, setShowFilters] = useState(true)
  const [showCopilot, setShowCopilot] = useState(true)
  const [theme, setTheme] = useState("light")
  const [fontSize, setFontSize] = useState("medium")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  const topTabs = ["FILE","HOME","INTAKE","TRIAGE","INVESTIGATION","RESOLUTION","ANALYTICS","QUALITY","INDUSTRIAL","AUTOMATION","ADD-INS","VIEW","HELP"]

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.style.setProperty("--bg", "#0F172A")
      root.style.setProperty("--card", "#1E293B")
      root.style.setProperty("--text", "#FFF")
      root.style.setProperty("--muted", "#94A3B8")
      root.style.setProperty("--border", "#334155")
      root.style.setProperty("--header-bg", "#1E293B")
      root.style.setProperty("--ribbon-bg", "#1E293B")
      root.style.setProperty("--panel-bg", "#1E293B")
    } else {
      root.style.setProperty("--bg", "#EEF2F6")
      root.style.setProperty("--card", "#FFF")
      root.style.setProperty("--text", "#101828")
      root.style.setProperty("--muted", "#667085")
      root.style.setProperty("--border", "#E5E7EB")
      root.style.setProperty("--header-bg", "#FFF")
      root.style.setProperty("--ribbon-bg", "#FFF")
      root.style.setProperty("--panel-bg", "#FFF")
    }
  }, [theme])

  useEffect(() => {
    const sizes = { small: "13px", medium: "14px", large: "16px" }
    document.documentElement.style.setProperty("--font-size", sizes[fontSize as keyof typeof sizes])
  }, [fontSize])

  const bg = theme === "dark" ? "#0F172A" : "#EEF2F6"
  const cardBg = theme === "dark" ? "#1E293B" : "#FFF"
  const text = theme === "dark" ? "#FFF" : "#101828"
  const muted = theme === "dark" ? "#94A3B8" : "#667085"
  const border = theme === "dark" ? "#334155" : "#E5E7EB"
  const headerBg = theme === "dark" ? "#1E293B" : "#FFF"
  const ribbonBg = theme === "dark" ? "#1E293B" : "#FFF"
  const panelBg = theme === "dark" ? "#1E293B" : "#FFF"
  const activeTabBg = theme === "dark" ? "#334155" : "#101828"
  const inactiveTabBg = theme === "dark" ? "#1E293B" : "#D1D5DB"
  const inactiveTabColor = theme === "dark" ? "#FFF" : "#101828"
  const activeTabColor = theme === "dark" ? "#FFF" : "#FFF"
  const buttonBg = "#14B8A6"
  const buttonHover = "#0F766E"
  const inputBg = theme === "dark" ? "#0F172A" : "#FFF"
  const inputBorder = theme === "dark" ? "#334155" : "#E5E7EB"
  const badgeBg = theme === "dark" ? "#0F172A" : "#F0FDFD"

  const cardStyle = { background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 16 }
  const buttonTeal = { background: buttonBg, color: "#FFF", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }
  const buttonWhite = { background: inputBg, color: text, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }
  const selectStyle = { border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, background: inputBg, color: text, minWidth: 200 }
  const closeButton = { background: "transparent", border: "none", color: muted, fontSize: 16, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }
  const floatingButton = { position: "fixed" as const, top: "50%", transform: "translateY(-50%)", zIndex: 100, background: cardBg, border: `1px solid ${border}`, borderRadius: "0 8px 8px 0", padding: "12px 8px", fontSize: 12, fontWeight: 600, color: text, cursor: "pointer" as const, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", writingMode: "vertical-rl" as const, textOrientation: "mixed" as const }
  const floatingButtonRight = { ...floatingButton, right: 0, borderRadius: "8px 0 0 8px" }
  const floatingButtonLeft = { ...floatingButton, left: 0 }

  const ribbonButtonStyle = { display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: cardBg, border: `1px solid ${border}`, borderRadius: 6, fontSize: 12, color: text }
  const dropdownStyle = { position: "absolute" as const, top: "100%", left: 0, width: 300, background: cardBg, border: `1px solid ${border}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 280, overflowY: "auto" as const }
  const dropdownItemStyle = { padding: "8px 12px", fontSize: 12, cursor: "pointer", borderBottom: `1px solid ${border}`, color: text }

  const settingsPanelStyle = { position: "absolute" as const, top: "100%", right: 0, width: 260, background: cardBg, border: `1px solid ${border}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, padding: 12, marginTop: 8 }
  const settingsSectionStyle = { marginBottom: 16 }
  const settingsLabelStyle = { fontSize: 11, color: muted, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8, display: "block" as const }
  const settingsButtonStyle = { padding: "8px 12px", borderRadius: 6, border: `1px solid ${border}`, background: cardBg, color: text, fontSize: 12, fontWeight: 500, cursor: "pointer" as const, marginRight: 6, marginBottom: 6 }
  const settingsButtonActiveStyle = { ...settingsButtonStyle, background: buttonBg, borderColor: buttonBg, color: "#FFF" }
  const infoTextStyle = { fontSize: 11, color: muted, lineHeight: 1.5, marginTop: 8 }

  return (
    <div style={{fontFamily:"Inter, system-ui", background: bg, minHeight:"100vh", color: text, fontSize: "var(--font-size)"}}>
      {/* HEADER */}
      <div style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", background: headerBg, borderBottom:`1px solid ${border}`}}>
        <div style={{width:"28px", height:"28px", background:"#14B8A6", transform:"rotate(45deg)", borderRadius:"6px"}}/>
        <b style={{fontSize:"18px"}}>OmniData Studio</b><b style={{fontSize:"20px"}}>ComplaintHub v6.1</b>
        <span style={{marginLeft:"12px", display:"flex", gap:"8px"}}>
          <span data-testid="badge-functions" style={{border:`1px solid ${border}`, padding:"6px 12px", borderRadius:"8px", fontSize:"12px", color:"#0F766E", background: badgeBg}}>13,500 Functions</span>
          <span style={{border:`1px solid ${border}`, padding:"6px 12px", borderRadius:"8px", fontSize:"12px", color:"#0F766E"}}>15 add-ins</span>
          <span style={{border:`1px solid ${border}`, padding:"6px 12px", borderRadius:"8px", fontSize:"12px", color:"#0F766E"}}>120 workflows</span>
        </span>
        <div style={{flex:1}}/>
        <span>🔍</span><span>🔔</span>
        <div style={{width:"32px", height:"32px", borderRadius:"50%", background:"#14B8A6", color:"#FFF", display:"flex", alignItems:"center", justifyContent:"center"}}>OP</div>

        {/* Settings Gear + Online Indicator */}
        <div style={{display:"flex", alignItems:"center", gap:"10px", marginLeft:"16px"}}>
          {/* Online/Offline Indicator */}
          <div style={{display:"flex", alignItems:"center", gap:"6px", padding:"6px 10px", background: cardBg, border:`1px solid ${border}`, borderRadius:20, fontSize:11}}>
            <div style={{width:8, height:8, borderRadius:"50%", background: isOnline ? "#14B8A6" : "#94A3B8"}}/>
            <span style={{color: isOnline ? "#0F766E" : muted}}>{isOnline ? "Online - AI ready" : "Offline - Descriptive still works"}</span>
          </div>

          {/* Settings Dropdown */}
          <div style={{position:"relative"}}>
            <button onClick={() => setSettingsOpen(!settingsOpen)} style={{background:"transparent", border:"none", fontSize:18, cursor:"pointer", padding:8, color: text}}>⚙️</button>
            {settingsOpen && (
              <div style={settingsPanelStyle}>
                <div style={settingsSectionStyle}>
                  <label style={settingsLabelStyle}>Theme</label>
                  <div>
                    <button onClick={() => setTheme("light")} style={theme === "light" ? settingsButtonActiveStyle : settingsButtonStyle}>Light</button>
                    <button onClick={() => setTheme("dark")} style={theme === "dark" ? settingsButtonActiveStyle : settingsButtonStyle}>Dark</button>
                    <button onClick={() => setTheme("auto")} style={theme === "auto" ? settingsButtonActiveStyle : settingsButtonStyle}>Auto</button>
                  </div>
                </div>
                <div style={settingsSectionStyle}>
                  <label style={settingsLabelStyle}>Font Size</label>
                  <div>
                    <button onClick={() => setFontSize("small")} style={fontSize === "small" ? settingsButtonActiveStyle : settingsButtonStyle}>Small</button>
                    <button onClick={() => setFontSize("medium")} style={fontSize === "medium" ? settingsButtonActiveStyle : settingsButtonStyle}>Medium</button>
                    <button onClick={() => setFontSize("large")} style={fontSize === "large" ? settingsButtonActiveStyle : settingsButtonStyle}>Large</button>
                  </div>
                </div>
                <div style={infoTextStyle}>
                  Descriptive, Frequencies, Filters work OFFLINE. AI Copilot needs INTERNET.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIBBON */}
      <div style={{display:"flex", gap:"8px", padding:"10px 16px", background: ribbonBg, overflowX:"auto", borderBottom:`1px solid ${border}`}}>
        {topTabs.map(t=>(
          <button key={t} data-testid={`tab-${t.toLowerCase()}`} onClick={()=>setActiveTop(t)} style={{padding:"8px 16px", borderRadius:"6px", border:`1px solid ${border}`, background: activeTop===t?activeTabBg:inactiveTabBg, color: activeTop===t?activeTabColor:inactiveTabColor, fontWeight:600, fontSize:"12px", whiteSpace:"nowrap"}}>{t}</button>
        ))}
      </div>

      {/* ANALYSIS ROW */}
      <div style={{display:"flex", flexWrap:"wrap", gap:"6px", padding:"10px 12px", background: ribbonBg, border:`1px solid ${border}`, margin:"8px 12px", borderRadius:"8px"}}>
        {Object.keys(RIBBON).map(k=>(
          <div key={k} style={{position:"relative"}}>
            <button data-testid={`ribbon-${k.toLowerCase().replace(/\s+/g,'-')}`} onClick={()=>setOpen(open===k?null:k)} style={ribbonButtonStyle}>
              {k} <span style={{fontSize:"10px"}}>▼</span>
            </button>
            {open===k && (
              <div style={dropdownStyle}>
                {RIBBON[k].map(it=>(
                  <div key={it} data-testid={`menu-${it.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`} onClick={()=>{
                    if (k === "Descriptive") { setActiveTop("ANALYTICS"); setActiveAnalysis("DESCRIPTIVE"); }
                    else if (k === "SPSS") { setActiveTop("ANALYTICS"); setActiveAnalysis("SPSS"); }
                    else { setActiveAnalysis("ANALYTICS_HOME"); }
                    setSel(it); setOpen(null)
                  }} style={dropdownItemStyle}>{it}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{display:"flex", gap:"12px", padding:"0 12px 24px", minHeight:"calc(100vh - 200px)"}}>

        {/* LEFT - FILTERS PANEL */}
        {showFilters && (
          <div style={{width:240, background: panelBg, border:`1px solid ${border}`, borderRadius:"12px", padding:"16px", height:"fit-content", position:"relative", flexShrink:0}}>
            <button onClick={() => setShowFilters(false)} style={{...closeButton, position:"absolute", top:8, right:8}} title="Hide Filters">×</button>
            <div style={{display:"flex", alignItems:"center", gap:"6px", marginBottom:16}}><span style={{color:"#14B8A6"}}>▽</span><span style={{fontWeight:700, fontSize:14, color: text}}>FILTERS</span></div>
            <div style={{marginTop:"16px", fontSize:"13px", fontWeight:600, color: text}}>Timeframe</div>
            <div style={{display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"8px"}}>
              {["7d","30d","90d","1y"].map(v=> <button key={v} data-testid={`timeframe-${v}`} style={{padding:"6px 14px", border:`1px solid ${border}`, borderRadius:"8px", background: v==="90d"?"#101828":inputBg, color: v==="90d"?"#FFF":text, fontSize:"12px"}}>{v}</button>)}
              <button data-testid="timeframe-custom" style={{padding:"6px 10px", border:`1px solid ${border}`, borderRadius:"8px", background: inputBg, fontSize:"12px", color: text}}>📅 Custom</button>
            </div>
            <div style={{marginTop:"18px", fontWeight:700, fontSize:"13px", color: text}}>Factory</div>
            <select data-testid="factory-select" style={{...selectStyle, width:"100%", marginTop:"6px"}}><option>Factory12</option></select>
            <div style={{marginTop:"18px", fontWeight:700, fontSize:"13px", color: text}}>Category</div>
            <select data-testid="category-select" style={{...selectStyle, width:"100%", marginTop:"6px"}}><option>All</option></select>
            <div style={{marginTop:"18px", fontWeight:700, fontSize:"13px", color: text}}>Loss Range</div>
            <div style={{display:"flex", gap:"6px", marginTop:"6px"}}><input data-testid="loss-min" defaultValue="$0" style={{width:"50%", padding:"8px", border:`1px solid ${border}`, borderRadius:"8px", background: inputBg, color: text}}/><input data-testid="loss-max" defaultValue="$50k" style={{width:"50%", padding:"8px", border:`1px solid ${border}`, borderRadius:"8px", background: inputBg, color: text}}/></div>
            <div style={{display:"flex", gap:"8px", marginTop:"20px"}}><button data-testid="save-filter" style={{flex:1, padding:"10px", border:`1px solid ${border}`, borderRadius:"8px", background: inputBg, fontWeight:600, color: text}}>Save Filter</button><button data-testid="apply-filter" style={{flex:1, padding:"10px", background: buttonBg, color:"#FFF", border:"none", borderRadius:"8px", fontWeight:600}}>Apply</button></div>
            <div style={{marginTop:"12px", fontSize:"11px", color: muted}}>Selected: {sel}</div>
          </div>
        )}

        {/* Floating button to show Filters when hidden */}
        {!showFilters && (
          <button onClick={() => setShowFilters(true)} style={floatingButtonLeft} title="Show Filters">
            ☰ Filters
          </button>
        )}

        {/* MIDDLE - CONTENT */}
        <div style={{flex:1, display:"flex", flexDirection:"column", gap:"12px", minWidth:0}}>
          {(() => {
            if (activeTop === "ANALYTICS" && activeAnalysis === "DESCRIPTIVE") return <DescriptiveTab />
            if (activeTop === "ANALYTICS" && activeAnalysis === "SPSS") return <div style={{...cardStyle}}>SPSS Dashboard - Coming Next</div>
            switch(activeTop) {
              case "FILE": return <FileView />;
              case "HOME": return <HomeView />;
              case "INTAKE": return <IntakeView />;
              case "TRIAGE": return <TriageView />;
              case "INVESTIGATION": return <InvestigationView />;
              case "RESOLUTION": return <ResolutionView />;
              case "ANALYTICS": return <AnalyticsView />;
              case "QUALITY": return <QualityView />;
              case "INDUSTRIAL": return <IndustrialAutomationView />;
              case "AUTOMATION": return <IndustrialAutomationView />;
              case "ADD-INS": return <AddInsView />;
              case "VIEW": return <ViewView />;
              case "HELP": return <HelpView />;
              default: return <AnalyticsView />;
            }
          })()}
        </div>

        {/* RIGHT - COPILOT PANEL */}
        {showCopilot && (
          <div style={{width:280, background: panelBg, border:`1px solid ${border}`, borderRadius:"12px", padding:"16px", height:"fit-content", position:"relative", flexShrink:0}}>
            <button onClick={() => setShowCopilot(false)} style={{...closeButton, position:"absolute", top:8, right:8}} title="Hide Copilot">×</button>
            <div style={{fontWeight:800, display:"flex", gap:"6px", color: text}}>Omni AI Copilot <span data-testid="copilot-live" style={{marginLeft:"auto", background:"#14B8A6", color:"#FFF", fontSize:"10px", padding:"2px 6px", borderRadius:"6px"}}>LIVE</span></div>
            <div style={{background: theme === "dark" ? "#0F172A" : "#E6F7F5", borderRadius:"10px", padding:"12px", marginTop:"12px"}}>
              <div style={{fontSize:"12px", color: text}}>Preserved ROI</div>
              <div data-testid="preserved-roi" style={{fontSize:"24px", fontWeight:800, color:"#14B8A6"}}>$1,249,000</div>
              <div style={{fontSize:"14px", color:"#14B8A6"}}>+940% ↗</div>
            </div>
            <div style={{marginTop:"16px", fontWeight:700, fontSize:"13px", color: text}}>Trust</div>
            <div style={{height:"6px", background: border, borderRadius:"3px", marginTop:"6px"}}><div style={{width:"80%", height:"100%", background:"#14B8A6", borderRadius:"3px"}}/></div>
            <div style={{fontSize:"11px", marginTop:"4px", color: muted}}>High confidence | 1,203 samples</div>
            <div style={{marginTop:"16px", fontWeight:700, fontSize:"13px", color: text}}>Receipt</div>
            <div style={{fontWeight:800, fontSize:"18px", color: text}}>#142</div>
            <div style={{fontSize:"11px", color: muted}}>Generated Oct 3, 2024 • 14:32 UTC</div>
            <div style={{background: theme === "dark" ? "#0F172A" : "#F9FAFB", border:`1px solid ${border}`, borderRadius:"8px", padding:"10px", fontSize:"11px", marginTop:"12px", color: text}}>• Seal degradation correlated with temp variability (0.68)</div>
            <button data-testid="open-copilot" style={{width:"100%", padding:"12px", background: buttonBg, color:"#FFF", border:"none", borderRadius:"8px", fontWeight:600, marginTop:"16px"}}>Open in Copilot Chat</button>
          </div>
        )}

        {/* Floating button to show Copilot when hidden */}
        {!showCopilot && (
          <button onClick={() => setShowCopilot(true)} style={floatingButtonRight} title="Show Copilot">
            Copilot ▸
          </button>
        )}

      </div>

      <p style={{marginTop:16, fontSize:12, color: muted, textAlign:"center"}}>Portal: 127.0.0.1:5175 | Source: GitHub main</p>
    </div>
  )
}