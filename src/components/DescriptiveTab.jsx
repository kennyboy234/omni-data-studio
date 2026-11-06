import { useState } from "react";
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

  const handleLoadTestData = () => { setData(testData); setMessage("Test Data Loaded - N=" + testData.length); };
  const handleFrequencies = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runFrequencies(data, variable); setResult(res); setResultType("frequencies"); setMessage("Frequencies done - Total " + res.Total); };
  const handleDescriptives = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runDescriptives(data, variable); setResult(res); setResultType("descriptives"); setMessage("Descriptives done - Mean " + res.Mean); };
  const handleExplore = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runExplore(data, variable); setResult(res); setResultType("explore"); setMessage("Explore done"); };
  const handleCrosstabs = () => { if (data.length === 0) { setMessage("Please click Load Test Data first"); return; } const res = runCrosstabs(data, rowVar, colVar); setResult(res); setResultType("crosstabs"); setMessage("Crosstabs done"); };

  return (
    <div style={{ padding: 20, background: "#0f172a", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 16 }}>Descriptive Analysis - Step 1</h2>
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleLoadTestData} style={{ background: "linear-gradient(to right, #14b8a6, #f97316)", color: "white", paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, border: "none", borderRadius: 10, marginRight: 10, cursor: "pointer" }}>Load Test Data</button>
        <button onClick={() => { setResult(null); setMessage("Results cleared"); }} style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, borderRadius: 10, cursor: "pointer" }}>Clear Results</button>
      </div>
      <p style={{ color: "#5eead4", marginBottom: 20 }}>{message}</p>
      <div style={{ marginBottom: 16 }}>
        <label>Select Variable: </label>
        <select value={variable} onChange={(e) => setVariable(e.target.value)} style={{ padding: 8, borderRadius: 8, marginLeft: 8 }}>
          <option value="Category">Category</option>
          <option value="Factory">Factory</option>
          <option value="Age">Age</option>
          <option value="Satisfaction">Satisfaction</option>
          <option value="Sales">Sales</option>
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleFrequencies} style={{ marginRight: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 8, cursor: "pointer" }}>Run Frequencies</button>
        <button onClick={handleDescriptives} style={{ marginRight: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 8, cursor: "pointer" }}>Run Descriptives</button>
        <button onClick={handleExplore} style={{ marginRight: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 8, cursor: "pointer" }}>Run Explore</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label>Row: </label>
        <select value={rowVar} onChange={(e) => setRowVar(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="Category">Category</option>
          <option value="Factory">Factory</option>
        </select>
        <label style={{ marginLeft: 12 }}>Column: </label>
        <select value={colVar} onChange={(e) => setColVar(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="Factory">Factory</option>
          <option value="Category">Category</option>
        </select>
        <button onClick={handleCrosstabs} style={{ marginLeft: 12, paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 8, cursor: "pointer" }}>Run Crosstabs</button>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 12 }}>
        <h3 style={{ marginBottom: 12 }}>Results - Visible Here</h3>
        {!result && <p>No results yet. Click Load Test Data, then Run.</p>}
        {result && resultType === "frequencies" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ padding: 12, textAlign: "left" }}>Value</th><th style={{ padding: 12 }}>Frequency</th><th style={{ padding: 12 }}>Percent</th><th style={{ padding: 12 }}>Valid Percent</th><th style={{ padding: 12 }}>Cumulative</th></tr></thead>
            <tbody>{result.table.map((row, i) => (<tr key={i}><td style={{ padding: 12 }}>{row.Value}</td><td style={{ padding: 12 }}>{row.Frequency}</td><td style={{ padding: 12 }}>{row.Percent}%</td><td style={{ padding: 12 }}>{row.ValidPercent}%</td><td style={{ padding: 12 }}>{row.CumulativePercent}%</td></tr>))}</tbody>
          </table>
        )}
        {result && resultType === "descriptives" && (<div style={{ padding: 12 }}><p>N: {result.N} | Missing: {result.Missing}</p><p>Mean: {result.Mean} | Median: {result.Median} | Mode: {result.Mode}</p><p>Std: {result.Std} | Min: {result.Min} | Max: {result.Max}</p></div>)}
        {result && resultType === "explore" && (<div style={{ padding: 12 }}><p>Skewness: {result.Skewness} | Kurtosis: {result.Kurtosis}</p><p>Outliers: {result.OutlierCount}</p></div>)}
        {result && resultType === "crosstabs" && (<div style={{ padding: 12 }}><p>Total: {result.Total}</p><pre>{JSON.stringify(result.table, null, 2)}</pre></div>)}
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>Portal: 127.0.0.1:5175 | Source: GitHub main</p>
    </div>
  );
}