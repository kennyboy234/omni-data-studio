import { useState, useMemo } from "react";
import { testData } from "../data/testData.js";
import { runFrequencies, runDescriptives, runExplore, runCrosstabs } from "../utils/descriptiveFunctions.js";

export default function DescriptiveTab() {
  const [data, setData] = useState([]);
  const [variable, setVariable] = useState("Category");
  const [rowVar, setRowVar] = useState("Category");
  const [colVar, setColVar] = useState("Factory");
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState("");
  const [message, setMessage] = useState("");
  const [viewerTab, setViewerTab] = useState("table");

  const handleLoadTestData = () => { setData(testData); setMessage("Test Data Loaded - N=" + testData.length); };
  const handleFrequencies = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runFrequencies(data, variable); setResult(res); setResultType("frequencies"); setViewerTab("table"); setMessage("Frequencies done - Total " + res.Total); };
  const handleDescriptives = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runDescriptives(data, variable); setResult(res); setResultType("descriptives"); setMessage("Descriptives done"); };
  const handleExplore = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runExplore(data, variable); setResult(res); setResultType("explore"); setMessage("Explore done"); };
  const handleCrosstabs = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runCrosstabs(data, rowVar, colVar); setResult(res); setResultType("crosstabs"); setMessage("Crosstabs done"); };
  const handleClear = () => { setResult(null); setResultType(""); setMessage(""); setViewerTab("table"); };

  const kpiN = data.length;
  const kpiVariables = useMemo(() => data.length > 0 ? Object.keys(data[0]).length : 0, [data]);
  const kpiMissing = useMemo(() => data.length > 0 ? data.reduce((sum, row) => sum + Object.values(row).filter(v => v === null || v === undefined || v === "").length, 0) : 0, [data]);
  const kpiFactories = useMemo(() => data.length > 0 ? new Set(data.map(r => r.Factory)).size : 0, [data]);

  const cardStyle = { background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" };
  const kpiCardStyle = { ...cardStyle, flex: 1, minWidth: 140 };
  const buttonTeal = { background: "#14B8A6", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
  const buttonWhite = { background: "#FFF", color: "#101828", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
  const buttonDark = { background: "#101828", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
  const selectStyle = { border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#FFF", minWidth: 200 };
  const activeTabStyle = { background: "#101828", color: "#FFF", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
  const inactiveTabStyle = { background: "#FFF", color: "#101828", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
  const descriptiveKpiStyle = { ...cardStyle, flex: 1, minWidth: 130, textAlign: "center" };

  return (
    <div style={{ background: "#EEF2F6", minHeight: "100vh", padding: "24px", fontFamily: "Inter, system-ui" }}>
      <h2 style={{ margin: "0 0 8px", color: "#101828", fontSize: 22 }}>Descriptive Statistics</h2>
      <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 13 }}>Frequencies · Descriptives · Explore · Crosstabs</p>

      {/* 4 KPI CARDS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>N</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{kpiN}</div>
          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>👥</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Variables</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{kpiVariables}</div>
          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>📊</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Missing</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{kpiMissing}</div>
          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>⚠️</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Factories</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{kpiFactories}</div>
          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>🏭</div>
        </div>
      </div>

      {/* CARD 1 - DATA */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#101828", marginBottom: 12 }}>Data</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={handleLoadTestData} style={buttonTeal}>Load Test Data</button>
          <button onClick={handleClear} style={buttonWhite}>Clear Results</button>
          {message && <span style={{ color: "#0F766E", fontSize: 13, fontWeight: 500 }}>{message}</span>}
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: "#667085", marginBottom: 4 }}>Select Variable</label>
          <select value={variable} onChange={e => setVariable(e.target.value)} style={selectStyle}>
            {data.length > 0 ? Object.keys(data[0]).map(k => <option key={k} value={k}>{k}</option>) : <option value="Category">Category</option>}
          </select>
        </div>
      </div>

      {/* CARD 2 - ANALYSIS */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#101828", marginBottom: 12 }}>Analysis</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={handleFrequencies} style={buttonDark}>Run Frequencies</button>
          <button onClick={handleDescriptives} style={buttonDark}>Run Descriptives</button>
          <button onClick={handleExplore} style={buttonDark}>Run Explore</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#667085", marginBottom: 4 }}>Row: Category</label>
            <select value={rowVar} onChange={e => setRowVar(e.target.value)} style={selectStyle}>
              {data.length > 0 ? Object.keys(data[0]).map(k => <option key={k} value={k}>{k}</option>) : <option value="Category">Category</option>}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#667085", marginBottom: 4 }}>Column: Factory</label>
            <select value={colVar} onChange={e => setColVar(e.target.value)} style={selectStyle}>
              {data.length > 0 ? Object.keys(data[0]).map(k => <option key={k} value={k}>{k}</option>) : <option value="Factory">Factory</option>}
            </select>
          </div>
          <button onClick={handleCrosstabs} style={{ ...buttonDark, alignSelf: "flex-end" }}>Run Crosstabs</button>
        </div>
      </div>

      {/* CARD 3 - RESULTS */}
      <div style={{ ...cardStyle, maxHeight: 400, overflowY: "auto" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#101828", marginBottom: 12 }}>Results - Visible Here</div>
        
        {/* Viewer Tabs - only for Frequencies */}
        {resultType === "frequencies" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button 
              onClick={() => setViewerTab("table")}
              style={viewerTab === "table" ? activeTabStyle : inactiveTabStyle}
            >
              Table View
            </button>
            <button 
              onClick={() => setViewerTab("chart")}
              style={viewerTab === "chart" ? activeTabStyle : inactiveTabStyle}
            >
              Chart View
            </button>
          </div>
        )}

        {!result && <p style={{ color: "#667085", fontSize: 13 }}>No results yet. Click Load Test Data, then Run.</p>}
        
        {result && resultType === "frequencies" && viewerTab === "table" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: 12, textAlign: "left", color: "#101828" }}>Value</th>
                <th style={{ padding: 12, color: "#101828" }}>Frequency</th>
                <th style={{ padding: 12, color: "#101828" }}>Percent</th>
                <th style={{ padding: 12, color: "#101828" }}>Valid Percent</th>
                <th style={{ padding: 12, color: "#101828" }}>Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {result.table.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: 12, color: "#101828" }}>{row.Value}</td>
                  <td style={{ padding: 12, color: "#101828" }}>{row.Frequency}</td>
                  <td style={{ padding: 12, color: "#101828" }}>{row.Percent}%</td>
                  <td style={{ padding: 12, color: "#101828" }}>{row.ValidPercent}%</td>
                  <td style={{ padding: 12, color: "#101828" }}>{row.CumulativePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {result && resultType === "frequencies" && viewerTab === "chart" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.table.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 100, fontSize: 14, color: "#101828", fontWeight: 500 }}>{row.Value}</div>
                <div style={{ flex: 1, background: "#EEF2F6", borderRadius: 8, height: 20, position: "relative" }}>
                  <div style={{ 
                    width: row.Percent + "%", 
                    background: "#14B8A6", 
                    borderRadius: 8, 
                    height: "100%",
                    transition: "width 0.3s ease"
                  }} />
                </div>
                <div style={{ width: 60, textAlign: "right", fontSize: 14, fontWeight: 700, color: "#101828" }}>
                  {row.Percent}%
                </div>
              </div>
            ))}
          </div>
        )}

        {result && resultType === "descriptives" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 4 }}>
            <div style={descriptiveKpiStyle}>
              <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Mean</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{result.Mean}</div>
            </div>
            <div style={descriptiveKpiStyle}>
              <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Median</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{result.Median}</div>
            </div>
            <div style={descriptiveKpiStyle}>
              <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Mode</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{result.Mode}</div>
            </div>
            <div style={descriptiveKpiStyle}>
              <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Std</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{result.Std}</div>
            </div>
            <div style={descriptiveKpiStyle}>
              <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Min</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{result.Min}</div>
            </div>
            <div style={descriptiveKpiStyle}>
              <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Max</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#101828" }}>{result.Max}</div>
            </div>
          </div>
        )}

        {result && resultType === "explore" && (
          <div style={{ padding: 12 }}>
            <p style={{ color: "#101828" }}>Skewness: {result.Skewness} | Kurtosis: {result.Kurtosis}</p>
            <p style={{ color: "#101828" }}>Outliers: {result.OutlierCount}</p>
          </div>
        )}
        {result && resultType === "crosstabs" && (
          <div style={{ padding: 12 }}>
            <p style={{ color: "#101828" }}>Total: {result.Total}</p>
            <pre style={{ color: "#101828", background: "#FFF", padding: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}>{JSON.stringify(result.table, null, 2)}</pre>
          </div>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "#667085" }}>Portal: 127.0.0.1:5175 | Source: GitHub main</p>
    </div>
  );
}