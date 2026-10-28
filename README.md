# OmniData Studio: Industrial Autonomy & Engineering Intelligence

OmniData Studio Extended is an enterprise-grade industrial engineering, robotics intelligence, and data analytics platform. It bridges continuous physical equipment telemetry (CAN Bus, ROS2, OPC UA, Modbus TCP) with high-craft mathematical rigor, AI autonomous planning, and standards-compliant verification.

---

## Key Capabilities & Architecture

### 1. Robotics, Kinematics & Neural Robot Brain
- **Denavit-Hartenberg (DH) Forward Kinematics**: $4 \times 4$ homogenous transformation matrix chain for 6-DOF industrial robot arms (e.g. Universal Robots UR10e, KUKA KR Quantec).
- **Jacobian Damped Least Squares (DLS) Inverse Kinematics**: Singularity-robust Cartesian targeting: $\Delta\theta = J^T (J J^T + \lambda^2 I)^{-1} e$.
- **Trapezoidal & S-Curve Motion Profiles**: Bounded velocity and acceleration trajectory interpolation with triangular and trapezoidal motion regimes.
- **Electric Motor Dynamic Sizing**: Peak & RMS torque sizing with inertial reflection and thermal continuous duty rating.
- **Ergonomics Calculator**: NIOSH 1991 Manual Lifting Equation (RWL and Lifting Index calculation).
- **Feedforward Neural Robot Brain Policy**: In-browser backpropagation training with multi-layer perceptron architecture, learning rate scheduling, and real-time actuation inference.

### 2. Reliability, Statistical Process Control (SPC) & OEE
- **Weibull Maximum Likelihood Estimation (MLE)**: 2-parameter Weibull shape $\beta$ and scale $\eta$ solved via 1D Newton-Raphson on right-censored industrial life data with Fisher information asymptotic covariance.
- **Kaplan-Meier Survival Estimator**: Non-parametric survival probabilities with Greenwood formula standard error confidence bounds.
- **Statistical Process Control**: I-MR, X-bar & R, p, c, EWMA, and CUSUM control charts with Western Electric run rules (Rules 1-4).
- **Gated Process Capability**: $C_p, C_{pk}, P_p, P_{pk}$ calculations strictly blocked if the process demonstrates out-of-control instability.
- **Gauge R&R Two-Way Crossed ANOVA**: AIAG MSA 4th Edition repeatability and reproducibility variance breakdown and Number of Distinct Categories (NDC).
- **ISO 22400 OEE Waterfall**: Availability, Performance, Quality, and TEEP loss decomposition.
- **Discrete-Event Simulation (DES)**: Seed-reproducible Monte Carlo event scheduling with $M/M/c$ queue modeling and bottleneck detection.

### 3. Predictive Models, Drift & Leakage Audit
- **Population Stability Index (PSI)**: Quantile-binned telemetry drift monitoring with Basel Accord thresholding (Stable $<0.10$, Moderate $0.10-0.25$, Significant $\ge 0.25$).
- **Two-Sample Kolmogorov-Smirnov (KS) Test**: Continuous cumulative distribution divergence test with asymptotic Kolmogorov distribution p-values.
- **Page-Hinkley Streaming Concept Drift Detector**: Sequential cumulative deviation test on streaming model residuals with automatic reset.
- **Group & Time Leakage Auditor**: Enforces strict chronological partitioning and asset group isolation to prevent temporal lookahead leakage.
- **NASA C-MAPSS Asymmetric RUL Scoring**: NASA Prognostics Center of Excellence exponential penalty penalizing late predictions up to 100x more severely than early predictions.
- **Multivariate Mahalanobis Distance**: Covariance-weighted multi-sensor anomaly detection with regularized Tikhonov matrix inversion.

### 4. Risk Analysis, FMEA & Fault Trees
- **AIAG-VDA 1st Edition Action Priority (AP)**: Severity-first priority matrix (High, Medium, Low) replacing flawed legacy multiplication RPN ($S \times O \times D$).
- **Duplicate-RPN Flaw Warning**: Identifies failure modes sharing identical RPNs that carry radically different safety consequences.
- **Fault Tree Analysis (FTA)**: Mokus (Method for Obtaining Cut Sets) Boolean absorption algorithm extracting minimal cut sets (MCS) and calculating Top Event probability.
- **Birnbaum & Criticality Importance**: Quantitative component sensitivity measures identifying single points of failure.
- **Reliability Block Diagrams (RBD)**: Series, Parallel, and $k$-out-of-$n$ active redundancy analytical calculations.

### 5. Universal Fleet & Cloud App Mesh
- **Industrial Telemetry Decoding**: Live CAN Bus byte frame decoding (BMS 0x102, Inverter 0x280) and ROS2 JointState topic decoding.
- **Dual In-Browser Python & JavaScript Sandbox**: Scoped execution with NumPy/Pandas array operations, assertion testing, and sandboxed standard output.
- **Enterprise Webhook Connectors**: Outbound synchronization to n8n, Supabase CDC, Microsoft Excel, SQL databases, and Word specifications.
- **Autonomous AI Task Controller**: Explainable natural-language intent decomposition, multi-step execution plans, and human-in-the-loop safety audit gates.

---

## Safety Boundary & Advisory Invariant

**CRITICAL SAFETY PRINCIPLE**: OmniData Studio Extended operates strictly in an **ADVISORY-ONLY, READ-ONLY TELEMETRY MESH** capacity. Under no circumstances does the application issue physical write commands, actuator overrides, or unverified mutating requests to real programmable logic controllers (PLCs), robotic arms, or vehicle actuators.

---

## Running Tests

OmniData Studio includes a comprehensive automated test suite powered by Vitest:

```bash
# Run all automated tests
npm test

# Run a specific domain suite
npx vitest run src/__tests__/predictiveModels.test.ts
npx vitest run src/__tests__/riskAnalysis.test.ts
npx vitest run src/__tests__/mcpAgentOrchestrator.test.ts
npx vitest run src/__tests__/universalConnectivity.test.ts
```

All 125+ unit tests pass with zero errors across all domain suites.
