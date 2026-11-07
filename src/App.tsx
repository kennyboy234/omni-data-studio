import { useState } from "react"
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
  const topTabs = ["FILE","HOME","INTAKE","TRIAGE","INVESTIGATION","RESOLUTION","ANALYTICS","QUALITY","INDUSTRIAL","AUTOMATION","ADD-INS","VIEW","HELP"]

  return (
    <div style={{fontFamily:"Inter, system-ui", background:"#EEF2F6", minHeight:"100vh", color:"#101828"}}>
      <div style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", background:"#FFF", borderBottom:"1px solid #E5E7EB"}}>
        <div style={{width:"28px", height:"28px", background:"#14B8A6", transform:"rotate(45deg)", borderRadius:"6px"}}/>
        <b style={{fontSize:"18px"}}>OmniData Studio</b><b style={{fontSize:"20px"}}>ComplaintHub v6.1</b>
        <span style={{marginLeft:"12px", display:"flex", gap:"8px"}}>
          <span data-testid="badge-functions" style={{border:"1px solid #E5E7EB", padding:"6px 12px", borderRadius:"8px", fontSize:"12px", color:"#0F766E", background:"#F0FDFD"}}>13,500 Functions</span>
          <span style={{border:"1px solid #E5E7EB", padding:"6px 12px", borderRadius:"8px", fontSize:"12px", color:"#0F766E"}}>15 add-ins</span>
          <span style={{border:"1px solid #E5E7EB", padding:"6px 12px", borderRadius:"8px", fontSize:"12px", color:"#0F766E"}}>120 workflows</span>
        </span>
        <div style={{flex:1}}/>
        <span>🔍</span><span>🔔</span>
        <div style={{width:"32px", height:"32px", borderRadius:"50%", background:"#14B8A6", color:"#FFF", display:"flex", alignItems:"center", justifyContent:"center"}}>OP</div>
      </div>

      <div style={{display:"flex", gap:"8px", padding:"10px 16px", background:"#E9EDF2", overflowX:"auto"}}>
        {topTabs.map(t=>(
          <button key={t} data-testid={`tab-${t.toLowerCase()}`} onClick={()=>setActiveTop(t)} style={{padding:"8px 16px", borderRadius:"6px", border:"1px solid #D1D5DB", background: activeTop===t?"#101828":"#D1D5DB", color: activeTop===t?"#FFF":"#101828", fontWeight:600, fontSize:"12px", whiteSpace:"nowrap"}}>{t}</button>
        ))}
      </div>

      <div style={{display:"flex", flexWrap:"wrap", gap:"6px", padding:"10px 12px", background:"#FFF", border:"1px solid #E5E7EB", margin:"8px 12px", borderRadius:"8px"}}>
        {Object.keys(RIBBON).map(k=>(
          <div key={k} style={{position:"relative"}}>
            <button data-testid={`ribbon-${k.toLowerCase().replace(/\s+/g,'-')}`} onClick={()=>setOpen(open===k?null:k)} style={{display:"flex", alignItems:"center", gap:"4px", padding:"6px 10px", background:"#FFF", border:"1px solid #E5E7EB", borderRadius:"6px", fontSize:"12px"}}>
              {k} <span style={{fontSize:"10px"}}>▼</span>
            </button>
            {open===k && (
              <div style={{position:"absolute", top:"100%", left:0, width:"300px", background:"#FFF", border:"1px solid #E5E7EB", borderRadius:"8px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:50, maxHeight:"280px", overflowY:"auto"}}>
{RIBBON[k].map(it=>(
                  <div key={it} data-testid={`menu-${it.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`} onClick={()=>{
                    if (k === "Descriptive") { setActiveTop("ANALYTICS"); setActiveAnalysis("DESCRIPTIVE"); }
                    else if (k === "SPSS") { setActiveTop("ANALYTICS"); setActiveAnalysis("SPSS"); }
                    else { setActiveAnalysis("ANALYTICS_HOME"); }
                    setSel(it); setOpen(null)
                  }} style={{padding:"8px 12px", fontSize:"12px", cursor:"pointer", borderBottom:"1px solid #F3F4F6"}}>{it}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{display:"flex", gap:"12px", padding:"0 12px 12px"}}>
        <div style={{width:"240px", background:"#FFF", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"16px", height:"fit-content"}}>
          <div style={{fontWeight:800, display:"flex", gap:"6px", alignItems:"center"}}><span style={{color:"#14B8A6"}}>▽</span>FILTERS</div>
          <div style={{marginTop:"16px", fontSize:"13px", fontWeight:600}}>Timeframe</div>
          <div style={{display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"8px"}}>
            {["7d","30d","90d","1y"].map(v=> <button key={v} data-testid={`timeframe-${v}`} style={{padding:"6px 14px", border:"1px solid #101828", borderRadius:"8px", background:v==="90d"?"#101828":"#FFF", color:v==="90d"?"#FFF":"#101828", fontSize:"12px"}}>{v}</button>)}
            <button data-testid="timeframe-custom" style={{padding:"6px 10px", border:"1px solid #101828", borderRadius:"8px", background:"#FFF", fontSize:"12px"}}>📅 Custom</button>
          </div>
          <div style={{marginTop:"18px", fontWeight:700, fontSize:"13px"}}>Factory</div>
          <select data-testid="factory-select" style={{width:"100%", padding:"8px", border:"1px solid #101828", borderRadius:"8px", marginTop:"6px"}}><option>Factory12</option></select>
          <div style={{marginTop:"18px", fontWeight:700, fontSize:"13px"}}>Category</div>
          <select data-testid="category-select" style={{width:"100%", padding:"8px", border:"1px solid #101828", borderRadius:"8px", marginTop:"6px"}}><option>All</option></select>
          <div style={{marginTop:"18px", fontWeight:700, fontSize:"13px"}}>Loss Range</div>
          <div style={{display:"flex", gap:"6px", marginTop:"6px"}}><input data-testid="loss-min" defaultValue="$0" style={{width:"50%", padding:"8px", border:"1px solid #101828", borderRadius:"8px"}}/><input data-testid="loss-max" defaultValue="$50k" style={{width:"50%", padding:"8px", border:"1px solid #101828", borderRadius:"8px"}}/></div>
          <div style={{display:"flex", gap:"8px", marginTop:"20px"}}><button data-testid="save-filter" style={{flex:1, padding:"10px", border:"1px solid #101828", borderRadius:"8px", background:"#FFF", fontWeight:600}}>Save Filter</button><button data-testid="apply-filter" style={{flex:1, padding:"10px", background:"#14B8A6", color:"#FFF", border:"none", borderRadius:"8px", fontWeight:600}}>Apply</button></div>
          <div style={{marginTop:"12px", fontSize:"11px", color:"#667085"}}>Selected: {sel}</div>
        </div>

        <div style={{flex:1, display:"flex", flexDirection:"column", gap:"12px"}}>
{(() => {
            if (activeTop === "ANALYTICS" && activeAnalysis === "DESCRIPTIVE") return <DescriptiveTab />
            if (activeTop === "ANALYTICS" && activeAnalysis === "SPSS") return <div style={{background:"#FFF", border:"1px solid #E5E7EB", borderRadius:12, padding:16}}>SPSS Dashboard - Coming Next</div>
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

        <div style={{width:"280px", background:"#FFF", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"16px", height:"fit-content"}}>
          <div style={{fontWeight:800, display:"flex", gap:"6px"}}>Omni AI Copilot <span data-testid="copilot-live" style={{marginLeft:"auto", background:"#14B8A6", color:"#FFF", fontSize:"10px", padding:"2px 6px", borderRadius:"6px"}}>LIVE</span></div>
          <div style={{background:"#E6F7F5", borderRadius:"10px", padding:"12px", marginTop:"12px"}}>
            <div style={{fontSize:"12px"}}>Preserved ROI</div>
            <div data-testid="preserved-roi" style={{fontSize:"24px", fontWeight:800, color:"#0F766E"}}>$1,249,000</div>
            <div style={{fontSize:"14px", color:"#0F766E"}}>+940% ↗</div>
          </div>
          <div style={{marginTop:"16px", fontWeight:700, fontSize:"13px"}}>Trust</div>
          <div style={{height:"6px", background:"#E5E7EB", borderRadius:"3px", marginTop:"6px"}}><div style={{width:"80%", height:"100%", background:"#14B8A6", borderRadius:"3px"}}/></div>
          <div style={{fontSize:"11px", marginTop:"4px"}}>High confidence | 1,203 samples</div>
          <div style={{marginTop:"16px", fontWeight:700, fontSize:"13px"}}>Receipt</div>
          <div style={{fontWeight:800, fontSize:"18px"}}>#142</div>
          <div style={{fontSize:"11px", color:"#667085"}}>Generated Oct 3, 2024 • 14:32 UTC</div>
          <div style={{background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:"8px", padding:"10px", fontSize:"11px", marginTop:"12px"}}>• Seal degradation correlated with temp variability (0.68)</div>
          <button data-testid="open-copilot" style={{width:"100%", padding:"12px", background:"#14B8A6", color:"#FFF", border:"none", borderRadius:"8px", fontWeight:600, marginTop:"16px"}}>Open in Copilot Chat</button>
        </div>
      </div>
    </div>
  )
}