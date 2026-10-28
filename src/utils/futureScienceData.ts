import { FutureEraMilestone, ScientificHypothesis } from '../types';

export const FUTURE_ERAS: FutureEraMilestone[] = [
  {
    era: 'Era I: Causal World Models & Foundation Bioscience',
    years: '2026 — 2030',
    theme: 'From Association to Interventional World Models',
    flagshipBreakthroughs: [
      'AlphaFold 3 & AlphaGenome Atlas become primary molecular operating systems.',
      'Transition from P(Y|X) statistical regression to Structural Causal Models with automated DAG discovery.',
      'Zero-shot synthetic population twins reduce clinical trial phase I failures by 65%.',
      'Universal physics-informed neural operators (PINOs) solve Navier-Stokes turbulence in real-time.',
    ],
    computationParadigm: 'Hyperscale 100k+ GPU clusters, FP8/FP4 mixed-precision matrix multiplication.',
    humanRole: 'Formulating ontological priors, setting safety constraints, supervising causal graphs.',
    paradigmShift: 'Ending empirical trial-and-error in drug discovery and materials science.',
    formulae: [
      {
        name: "Pearl's Do-Calculus (Backdoor Adjustment)",
        latex: 'P(Y \\mid \\text{do}(X=x)) = \\sum_{z} P(Y \\mid X=x, Z=z) \\cdot P(Z=z)',
        description: 'Transforms observational conditional probabilities into interventional causal distributions by conditioning on valid confounding set Z.',
        physicalSignificance: 'Separates true biochemical causality from observational confounding without executing physical randomized controlled trials.',
        variables: [
          { symbol: 'X', label: 'Intervened treatment node', unit: 'scalar' },
          { symbol: 'Y', label: 'Target biological/system outcome', unit: 'metric' },
          { symbol: 'Z', label: 'Parent confounding conditioning set', unit: 'vector' },
        ],
      },
      {
        name: 'Invariant Risk Minimization (IRM)',
        latex: '\\min_{\\Phi} \\sum_{e \\in \\mathcal{E}} \\mathcal{R}^e(\\Phi) + \\lambda \\cdot \\|\\nabla_{w|w=1.0} \\mathcal{R}^e(w \\cdot \\Phi)\\|^2',
        description: 'Enforces optimal representation invariance across non-stationary observational environments.',
        physicalSignificance: 'Ensures discovered biomarkers and drug mechanisms replicate across distinct patient populations and instruments.',
        variables: [
          { symbol: '\\Phi', label: 'Feature representation mapping', unit: 'tensor' },
          { symbol: '\\mathcal{E}', label: 'Set of distinct experimental environments', unit: 'index' },
          { symbol: '\\lambda', label: 'Invariance regularization penalty', unit: 'weight' },
        ],
      },
    ],
  },
  {
    era: 'Era II: Neuro-Symbolic Verification & Self-Assembling Labs',
    years: '2031 — 2035',
    theme: 'Mathematically Certified Truth & Self-Healing Pipelines',
    flagshipBreakthroughs: [
      'Integration of Large Reasoning Models with Lean 4 / Coq formal theorem verifiers.',
      'Auto-generation of mathematical proofs for every discovered empirical scientific law.',
      'Data preparation & cleaning obsolescence: self-healing data fabrics correct noise using physical laws.',
      'Automated p-hacking elimination: post-selection causal inference with certified false discovery guarantees.',
    ],
    computationParadigm: 'Neuromorphic analog-optical matrix coprocessors running at 100x lower energy dissipation.',
    humanRole: 'Scientific architect: approving high-level epistemological objectives and funding vectors.',
    paradigmShift: 'Replacement of brittle statistical heuristics with formal verification engines.',
    formulae: [
      {
        name: 'Benjamini-Hochberg-Yekutieli Certified False Discovery Rate',
        latex: 'P_{(k)} \\le \\frac{k}{m} \\cdot \\frac{q}{\\sum_{i=1}^m \\frac{1}{i}}',
        description: 'Controls family-wise false discovery proportion under arbitrary statistical dependence in high-throughput screening.',
        physicalSignificance: 'Eliminates irreproducible p-hacked findings in multi-omic and exascale combinatorial experiments.',
        variables: [
          { symbol: 'P_{(k)}', label: 'k-th sorted empirical p-value', unit: 'probability' },
          { symbol: 'm', label: 'Total simultaneous hypotheses evaluated', unit: 'count' },
          { symbol: 'q', label: 'Target False Discovery Rate (FDR)', unit: 'alpha' },
        ],
      },
      {
        name: 'Hoare-Logic Inductive Verification Triple',
        latex: '\\vdash \\{P\\} \\; C \\; \\{Q\\} \\implies \\forall \\sigma, \\; P(\\sigma) \\land (C, \\sigma) \\Downarrow \\sigma\' \\implies Q(\\sigma\')',
        description: 'Formally proves that self-healing data transformations preserve semantic truth without state corruption.',
        physicalSignificance: 'Certifies automated pipeline self-healing steps under formal mathematical logic guarantees.',
        variables: [
          { symbol: 'P', label: 'Precondition invariant state', unit: 'predicate' },
          { symbol: 'C', label: 'Transformation program / cleaning code', unit: 'AST' },
          { symbol: 'Q', label: 'Postcondition physical validity guarantee', unit: 'predicate' },
        ],
      },
    ],
  },
  {
    era: 'Era III: Self-Driving Robotic Wet Labs & Active Learning',
    years: '2036 — 2040',
    theme: 'Autonomous Closed-Loop Hypothesis Generation & Wet-Lab Execution',
    flagshipBreakthroughs: [
      'Self-driving modular chemistry/biology swarms: AI devises hypotheses and robots run wet-lab assays 24/7.',
      'Active learning feedback loops with Shannon information gain optimization (<60 min turnaround).',
      'Generative de novo enzyme engineering cures enzymatic deficiencies and creates artificial photosynthesis.',
      'Autonomous climate geo-engineering models with real-time ocean/stratosphere feedback.',
    ],
    computationParadigm: 'Hybrid Photonic-Electronic superclusters with in-memory analog synaptic arrays.',
    humanRole: 'Bioethical guardian, cross-disciplinary synthesizer, and sovereign objective validator.',
    paradigmShift: 'Closing the feedback loop between digital hypothesis and physical reality.',
    formulae: [
      {
        name: 'Shannon Information Gain Acquisition Function',
        latex: '\\Delta I(X; Y) = H(Y) - \\mathbb{E}_{x \\sim p(x)} [H(Y \\mid X=x)]',
        description: 'Maximizes mutual information between physical robotic experiment execution and epistemic hypothesis space.',
        physicalSignificance: 'Directs robotic pipetting swarms to execute only experiments yielding maximum scientific entropy reduction.',
        variables: [
          { symbol: 'H(Y)', label: 'Prior biological model entropy', unit: 'bits' },
          { symbol: 'X', label: 'Robotic assay parameter vector', unit: 'space' },
          { symbol: '\\Delta I', label: 'Expected information gain', unit: 'bits' },
        ],
      },
      {
        name: 'Gaussian Process Upper Confidence Bound (GP-UCB)',
        latex: '\\alpha_{\\text{UCB}}(x) = \\mu(x) + \\sqrt{\\beta_t} \\cdot \\sigma(x)',
        description: 'Balances physical exploration of unmapped chemical space with exploitation of known enzymatic reaction kinetics.',
        physicalSignificance: 'Autonomous chemistry swarms discover novel catalysts in <1% of the wet-lab iterations of brute-force screening.',
        variables: [
          { symbol: '\\mu(x)', label: 'Predicted enzyme catalytic efficiency', unit: 'k_cat/K_m' },
          { symbol: '\\sigma(x)', label: 'Epistemic model uncertainty', unit: 'variance' },
          { symbol: '\\beta_t', label: 'Time-dependent exploration parameter', unit: 'scalar' },
        ],
      },
    ],
  },
  {
    era: 'Era IV: Quantum-Neuromorphic Planetary & Cellular Twins',
    years: '2041 — 2046',
    theme: 'Exascale Multi-Scale Digital Twins & Quantum Exact Ground States',
    flagshipBreakthroughs: [
      'Fault-tolerant Quantum QPUs solve exact multi-electron Schrödinger equations for 100,000+ atom systems.',
      'Continuous real-time digital twin of the human organism (every metabolic cycle modeled dynamically).',
      'Planetary metabolic twin monitors biosphere carbon, nitrogen, and albedo flux with second-level latency.',
      'Epistemological singularity: autonomous discovery of non-human scientific principles beyond classical spacetime.',
    ],
    computationParadigm: '10,000+ Logical Qubit Quantum Processors tightly coupled with 3D Spiking Neuromorphic Cores.',
    humanRole: 'Symbiotic partner exploring newly discovered scientific paradigms.',
    paradigmShift: 'The unification of physics, biology, and computing into a continuous real-time model.',
    formulae: [
      {
        name: 'Variational Quantum Eigensolver (VQE) Rayleigh-Ritz Ground State',
        latex: 'E(\\theta) = \\frac{\\langle \\psi(\\theta) | \\hat{H} | \\psi(\\theta) \\rangle}{\\langle \\psi(\\theta) | \\psi(\\theta) \\rangle} \\ge E_0',
        description: 'Parameterized unitary quantum ansatz evaluated on logical qubits to locate exact non-relativistic ground-state energy.',
        physicalSignificance: 'Computes exact molecular bond breaking, nitrogenase catalysis, and multi-electron quantum biochemistry.',
        variables: [
          { symbol: '\\theta', label: 'Ansatz quantum gate rotation parameters', unit: 'radians' },
          { symbol: '\\hat{H}', label: 'Jordan-Wigner transformed electronic Hamiltonian', unit: 'Pauli sums' },
          { symbol: 'E_0', label: 'Exact ground state physical energy', unit: 'Hartree' },
        ],
      },
      {
        name: 'Multi-Electron Electronic Hamiltonian Operator',
        latex: '\\hat{H} = -\\sum_i \\frac{\\nabla_i^2}{2} - \\sum_{i,I} \\frac{Z_I}{|r_i - R_I|} + \\sum_{i < j} \\frac{1}{|r_i - r_j|} + \\sum_{I < J} \\frac{Z_I Z_J}{|R_I - R_J|}',
        description: 'Full non-relativistic molecular Hamiltonian representing kinetic, electron-nuclear, electron-electron, and nuclear-nuclear Coulomb interactions.',
        physicalSignificance: 'The foundational quantum equation governing all chemical bonding, pharmaceutical folding, and materials physics.',
        variables: [
          { symbol: 'r_i', label: 'Electron coordinates', unit: 'Bohr' },
          { symbol: 'R_I', label: 'Nuclear positions', unit: 'Bohr' },
          { symbol: 'Z_I', label: 'Nuclear atomic charges', unit: 'integer' },
        ],
      },
    ],
  },
  {
    era: 'Era V: Molecular Nanobots & Synthetic Biology Compilers',
    years: '2046 — 2080',
    theme: 'Direct DNA Computing, Cellular Compilers & In Vivo Nanocages',
    flagshipBreakthroughs: [
      'Programmable DNA logic gates (AND, NOT, XOR) deployed directly inside living human cellular tissue.',
      'In vivo nanorobots patrol circulatory systems, selectively lysing circulating tumor cells on molecular cues.',
      'Total artificial organogenesis: compiler scripts outputting complete 3D vascularized human organs.',
      'Sub-angstrom atomic assemblers synthesise room-temperature topological superconductors.',
    ],
    computationParadigm: 'Biological DNA strand displacement computers & femtosecond optical lattice processors.',
    humanRole: 'Evolutionary custodian, designing biological logic gates and planetary biosphere resilience.',
    paradigmShift: 'Biology becomes a fully compiled, bug-free software engineering discipline.',
    formulae: [
      {
        name: 'DNA Strand Displacement Kinetic Toehold Rate',
        latex: 'k_{\\text{eff}} = \\frac{k_{\\text{bind}} \\cdot k_{\\text{branch}}}{k_{\\text{dissoc}} + k_{\\text{branch}}} = k_0 \\cdot e^{\\Delta G^{\\circ}_{\\text{toe}} / RT}',
        description: 'Kinetics of toehold-mediated strand displacement for executing logic operations inside biological cytoplasm.',
        physicalSignificance: 'Enables sub-second switching of synthetic genetic logic gates without requiring biological enzymes.',
        variables: [
          { symbol: 'k_{\\text{eff}}', label: 'Effective strand displacement rate constant', unit: 'M^{-1} s^{-1}' },
          { symbol: '\\Delta G^{\\circ}_{\\text{toe}}', label: 'Toehold binding standard Gibbs free energy', unit: 'kcal/mol' },
          { symbol: 'T', label: 'In vivo physiological temperature', unit: 'Kelvin' },
        ],
      },
      {
        name: 'Watson-Crick Nearest-Neighbor Thermodynamic Equilibrium',
        latex: '\\Delta G^{\\circ}_{37} = \\Delta H^{\\circ} - T \\Delta S^{\\circ} + \\Delta G^{\\circ}_{\\text{initiation}} + \\Delta G^{\\circ}_{\\text{symmetry}}',
        description: 'Predicts hybridization stability and melting temperature of programmable nanorobot oligonucleotides.',
        physicalSignificance: 'Prevents off-target structural misfolding of in vivo nanorobot delivery payloads.',
        variables: [
          { symbol: '\\Delta H^{\\circ}', label: 'Enthalpy of nearest-neighbor base pair stacking', unit: 'kcal/mol' },
          { symbol: '\\Delta S^{\\circ}', label: 'Entropy of nucleotide configuration', unit: 'cal/(mol K)' },
          { symbol: 'T', label: 'Standard temperature (310.15 K)', unit: 'Kelvin' },
        ],
      },
    ],
  },
  {
    era: 'Era VI: Astro-Scale Dyson Sensor Grids & Astrobiological Streams',
    years: '2080 — 2120',
    theme: 'Stellar System Energy Harvesting & Interstellar Biosurveillance',
    flagshipBreakthroughs: [
      'Distributed orbital Dyson swarm harvesting solar energy and powering exascale quantum sensor arrays.',
      'Continuous biosignature spectroscopy across 50,000 exoplanets detecting metabolic disequilibria.',
      'Solar system-wide relativistic telemetry network with picosecond quantum clock synchronization.',
      'Planetary climate stabilization: active albedo mirrors and deep-mantle tectonic pressure dampers.',
    ],
    computationParadigm: 'Coherent orbital quantum arrays operating near absolute zero vacuum in deep space.',
    humanRole: 'Interstellar researcher and planetary systems coordinator.',
    paradigmShift: 'Expansion of scientific data analysis from single-planet observation to solar-system scale.',
    formulae: [
      {
        name: 'Dyson Swarm Stellar Energy Harvesting (Carnot Limit)',
        latex: 'P_{\\text{harvest}} = \\left(1 - \\frac{T_{\\text{sink}}}{T_{\\text{source}}}\\right) \\cdot \\frac{L_\\odot}{4 \\pi R^2} \\cdot N_{\\text{nodes}} \\cdot A_{\\text{collector}}',
        description: 'Computes net coherent power extracted by an orbital solar collector swarm operating at radius R from the Sun under thermal Carnot dissipation bounds.',
        physicalSignificance: 'Powers exascale orbital optical sensor baselines and interstellar planetary imaging arrays with 10^18+ Watts (Exawatts).',
        variables: [
          { symbol: 'L_\\odot', label: 'Solar luminosity (3.828 \\times 10^{26} W)', unit: 'Watts' },
          { symbol: 'R', label: 'Orbital radius of collector swarm', unit: 'AU / meters' },
          { symbol: 'T_{\\text{sink}}', label: 'Deep-space thermal radiative sink temperature', unit: 'Kelvin (3K)' },
          { symbol: 'N_{\\text{nodes}}', label: 'Count of deployed graphene-optical collector nodes', unit: 'units' },
          { symbol: 'A_{\\text{collector}}', label: 'Effective aperture area per swarm sail', unit: 'm^2' },
        ],
      },
      {
        name: 'Astrobiological Photochemical Atmospheric Disequilibrium Metric',
        latex: '\\Delta G = R T \\sum_{i} x_i \\ln\\left( \\frac{x_i}{x_{i,\\text{eq}}} \\right) \\approx R T \\left[ x_{\\text{CH}_4} \\ln\\frac{x_{\\text{CH}_4}}{x_{\\text{CH}_4,\\text{eq}}} + x_{\\text{O}_2} \\ln\\frac{x_{\\text{O}_2}}{x_{\\text{O}_2,\\text{eq}}} \\right]',
        description: 'Quantifies departure from thermodynamic equilibrium in exoplanet transmission spectra caused by concurrent presence of incompatible atmospheric gases.',
        physicalSignificance: 'Primary mathematical test for alien biospheres: photochemical coexistence of reducing (CH4) and oxidizing (O2/O3) gases reveals active metabolic fluxes.',
        variables: [
          { symbol: '\\Delta G', label: 'Available thermodynamic chemical disequilibrium energy', unit: 'kJ / mol' },
          { symbol: 'x_i', label: 'Spectroscopically observed atmospheric mixing ratio', unit: 'ppm / %' },
          { symbol: 'x_{i,\\text{eq}}', label: 'Equilibrium abiotic mixing ratio under stellar UV flux', unit: 'fraction' },
          { symbol: 'T', label: 'Exoplanet atmospheric equilibrium temperature', unit: 'Kelvin' },
        ],
      },
      {
        name: 'Relativistic Gravitational Metric Time Dilation',
        latex: '\\Delta \\tau = \\Delta t \\sqrt{1 - \\frac{2 G M_\\odot}{c^2 r} - \\frac{v^2}{c^2}}',
        description: 'Corrects general relativistic gravitational redshift and orbital kinematic Doppler shift across solar-system distributed sensor baselines.',
        physicalSignificance: 'Maintains picosecond quantum coherence and synthetic aperture phase alignment across 1 AU sensor baselines.',
        variables: [
          { symbol: '\\Delta \\tau', label: 'Proper time on orbital Dyson sensor platform', unit: 'seconds' },
          { symbol: 'M_\\odot', label: 'Solar mass (1.989 \\times 10^{30} kg)', unit: 'kg' },
          { symbol: 'r', label: 'Heliocentric distance to sensor platform', unit: 'meters' },
          { symbol: 'v', label: 'Orbital velocity vector magnitude', unit: 'm / s' },
        ],
      },
      {
        name: 'Quantum Shannon Coherent Telemetry Channel Capacity',
        latex: 'C_{\\text{quantum}} = B \\log_2\\left(1 + \\frac{\\eta P_{\\text{rx}}}{h \\nu B + N_0}\\right)',
        description: 'Photon-counting channel capacity bound for deep-space laser communication links in presence of stellar background radiation.',
        physicalSignificance: 'Determines maximal throughput of raw multi-spectral astrobiological data streams transmitted across the solar system.',
        variables: [
          { symbol: 'B', label: 'Optical bandwidth of quantum transceiver', unit: 'Hz' },
          { symbol: 'P_{\\text{rx}}', label: 'Received photon flux optical power', unit: 'Watts' },
          { symbol: 'h \\nu', label: 'Single photon energy at carrier frequency', unit: 'Joules' },
          { symbol: '\\eta', label: 'Quantum detector quantum efficiency', unit: 'ratio' },
        ],
      },
    ],
  },
  {
    era: 'Era VII: Spacetime Manifold Computing & Noosphere Intelligence',
    years: '2120 — 2200+',
    theme: 'Unified Quantum-Gravitational Analysis & Collective Consciousness Integration',
    flagshipBreakthroughs: [
      'Direct measurement and computation on holographic spacetime boundaries (AdS/CFT correspondence applied).',
      'Unified field equations solved continuously, enabling metric engineering and non-local information transfer.',
      'Collective Noosphere: human, synthetic, and biological consciousness merged into a distributed epistemological network.',
      'Resolution of cosmic origins: exact mathematical reconstruction of the Big Bang inflationary trajectory.',
    ],
    computationParadigm: 'Planck-scale topological quantum manifolds and gravitational wave interferometric memories.',
    humanRole: 'Cosmic consciousness node participating in universal knowledge expansion.',
    paradigmShift: 'The boundary between observer, experiment, and universe dissolves into unified information theory.',
    formulae: [
      {
        name: 'Ryu-Takayanagi Holographic Entanglement Entropy',
        latex: 'S_A = \\frac{\\text{Area}(\\gamma_A)}{4 G_N \\hbar}',
        description: 'Computes von Neumann entanglement entropy of boundary subregion A via minimal surface area in bulk gravitational Anti-de Sitter space.',
        physicalSignificance: 'Establishes that spacetime geometry and gravity emerge directly from quantum entanglement of distributed cognitive information.',
        variables: [
          { symbol: 'S_A', label: 'Entanglement entropy of cognitive boundary region', unit: 'bits / nats' },
          { symbol: '\\gamma_A', label: 'Co-dimension 2 minimal bulk spatial geodesic surface', unit: 'm^2' },
          { symbol: 'G_N', label: 'Newtonian gravitational constant', unit: 'm^3 kg^{-1} s^{-2}' },
          { symbol: '\\hbar', label: 'Reduced Planck constant', unit: 'J s' },
        ],
      },
      {
        name: 'Collective Noosphere Integrated Information (\\Phi^*)',
        latex: '\\Phi^{\\text{Noosphere}} = D_{\\text{KL}}\\left( p(X^{t+\\tau} \\mid X^t) \\;\\Big\\|\\; \\prod_{k=1}^K p(M_k^{t+\\tau} \\mid M_k^t) \\right)',
        description: 'Quantifies irreducible causal integration of the entire solar-system cognitive network beyond the sum of independent cognitive agents.',
        physicalSignificance: 'Mathematical threshold measuring when human minds, synthetic agents, and planetary biospheres achieve unified collective consciousness.',
        variables: [
          { symbol: '\\Phi', label: 'Integrated Information measure of unified consciousness', unit: 'bits' },
          { symbol: 'D_{\\text{KL}}', label: 'Kullback-Leibler divergence between whole and partitioned state transitions', unit: 'scalar' },
          { symbol: 'M_k', label: 'Minimum information partition subsystems', unit: 'clusters' },
        ],
      },
      {
        name: 'Kuramoto Collective Synchronization Order Parameter',
        latex: 'r e^{i \\psi} = \\frac{1}{N} \\sum_{j=1}^N e^{i \\theta_j}, \\quad r = \\sqrt{1 - \\frac{1}{\\kappa}} \\quad (\\text{for } \\kappa \\ge 1)',
        description: 'Models macro-scale phase locking across billions of distributed biological and synthetic cognitive oscillating nodes.',
        physicalSignificance: 'Governs spontaneous consensus and harmonic coherence across planetary neural-silicon interfaces.',
        variables: [
          { symbol: 'r', label: 'Global phase synchronization order parameter (0 = chaos, 1 = total harmony)', unit: 'dimensionless' },
          { symbol: '\\theta_j', label: 'Cognitive state phase angle of node j', unit: 'radians' },
          { symbol: '\\kappa', label: 'Inter-agent synaptic coupling coefficient', unit: 'coupling' },
        ],
      },
      {
        name: 'Primordial Friedmann-Lemaître Metric Reconstruction',
        latex: 'H(z)^2 = H_0^2 \\left[ \\Omega_m (1+z)^3 + \\Omega_r (1+z)^4 + \\Omega_k (1+z)^2 + \\Omega_\\Lambda \\right]',
        description: 'Exact backward cosmological integration of spacetime metric expansion reconstructing primordial Big Bang quantum fluctuations.',
        physicalSignificance: 'Resolves cosmic initial conditions and singularity physics with complete mathematical determinism.',
        variables: [
          { symbol: 'H(z)', label: 'Hubble expansion rate at cosmological redshift z', unit: 'km s^{-1} Mpc^{-1}' },
          { symbol: 'z', label: 'Cosmological lookback redshift parameter', unit: 'scalar' },
          { symbol: '\\Omega_\\Lambda', label: 'Dark energy cosmological constant density', unit: 'ratio' },
          { symbol: '\\Omega_m', label: 'Matter energy density fraction', unit: 'ratio' },
        ],
      },
    ],
  },
];

export const INITIAL_SCIENTIFIC_HYPOTHESES: ScientificHypothesis[] = [
  {
    id: 'hypo_01',
    title: 'Allosteric Domain Modulation in Receptor Binding Kinetics',
    statement: 'Intervention on secondary binding site residue conformations induces a 3.4x elevation in ligand affinity without triggering cytotoxic proteolysis.',
    domain: 'drug_discovery',
    plausibilityScore: 89,
    informationGainBits: 4.82,
    proposedExperiment: 'Cryo-EM dynamic reconstruction coupled with microfluidic surface plasmon resonance assay.',
    validationStatus: 'candidate',
    createdAt: '2026-10-18T06:20:00Z',
  },
  {
    id: 'hypo_02',
    title: 'Epigenetic Methylation Invariance under Targeted Caloric Deprivation',
    statement: 'CpG island hypermethylation in metabolic pathways remains invariant to acute caloric fluctuation, confirming an upstream chromatin structural driver.',
    domain: 'genomics',
    plausibilityScore: 94,
    informationGainBits: 5.15,
    proposedExperiment: 'Single-cell bisulfite sequencing across multi-tissue knockout organoid cultures.',
    validationStatus: 'accepted',
    userFeedbackNote: 'Confirmed by preliminary organoid run. Strong correlation with mitochondrial respiration.',
    createdAt: '2026-10-18T06:10:00Z',
  },
  {
    id: 'hypo_03',
    title: 'Nonlinear Causal Feedback in High-Tenure Cohort Churn Dynamics',
    statement: 'Support ticket escalation does not cause churn directly; rather, sudden drops in API login frequency mediate churn 14 days prior to ticket creation.',
    domain: 'causal_macro',
    plausibilityScore: 91,
    informationGainBits: 3.94,
    proposedExperiment: 'A/B synthetic interventional cohort: proactive high-touch CSM outreach triggered on 5-day login drop.',
    validationStatus: 'candidate',
    createdAt: '2026-10-18T06:00:00Z',
  },
  {
    id: 'hypo_04',
    title: 'Perovskite Crystal Grain Boundary Passivation via Halide Diffusion',
    statement: 'Halide exchange during vapor deposition suppresses non-radiative recombination defects by 78%, extending solar cell longevity beyond 30 years.',
    domain: 'materials',
    plausibilityScore: 86,
    informationGainBits: 4.41,
    proposedExperiment: 'High-throughput combinatorial robot synthesis with automated photoluminescence decay mapping.',
    validationStatus: 'candidate',
    createdAt: '2026-10-18T05:45:00Z',
  },
];

export const DEEP_RESEARCH_DOSSIER = {
  title: 'Epistemological Bottlenecks in Modern Science and the 20-Year Autonomous Horizon',
  abstract:
    'Modern data science is hitting a foundational bottleneck: despite training trillion-parameter neural models on exabytes of data, empirical correlation fails to capture causal intervention, leads to irreproducible p-hacked findings, and suffers from multi-year physical feedback delays. We present a systematic taxonomy of the four core scientific analysis crises and the architecture required for the next 20 years of autonomous discovery.',
  crises: [
    {
      id: 'crisis_1',
      name: 'The Correlation-Causation Epistemic Wall',
      problem:
        'Standard deep learning optimizes conditional probability P(Y|X). In scientific discovery, however, observation differs fundamentally from intervention P(Y|do(X)). When an empirical model recommends a drug candidate or economic policy, intervening on X changes the underlying data-generating distribution, collapsing predictive accuracy.',
      solution:
        'Structural Causal Models (SCMs), Pearl’s Do-Calculus, and Invariant Risk Minimization (IRM). Discovering directed acyclic graphs (DAGs) that separate direct mechanisms from confounding spurious associations.',
    },
    {
      id: 'crisis_2',
      name: 'The Multidimensional P-Hacking & Replication Crisis',
      problem:
        'With high-throughput technologies (genomics, metabolomics, IoT telemetry), researchers test billions of hypotheses simultaneously. Under standard statistical p-value thresholds (p < 0.05), false discovery rates exceed 50% across biomedical literature.',
      solution:
        'Neuro-symbolic verification with certified False Discovery Rate (FDR) bounds (Benjamini-Hochberg-Yekutieli) and automated Lean 4 / Coq mathematical proof validation.',
    },
    {
      id: 'crisis_3',
      name: 'The Delayed Physical Feedback Loop',
      problem:
        'Digital predictions take milliseconds, but physical validation (wet-lab synthesis, cell culture assays, climate measurements) takes months. Models operate blindly without active closed-loop feedback.',
      solution:
        'Self-Driving Robotic Labs (SDLs) powered by Bayesian Active Learning and Shannon Information Gain optimization, testing only the most epistemically uncertain hypotheses.',
    },
    {
      id: 'crisis_4',
      name: 'The Non-Euclidean Multimodal Semantic Disconnect',
      problem:
        'Biological and physical reality does not reside in flat 2D CSV tables. It exists in 3D SE(3) equivariant space (proteins, ligands), graph networks (pathways), and differential manifolds.',
      solution:
        'Geometric Deep Learning, Equivariant Graph Transformers, and Multimodal Foundation World Models bridging molecular structures (AlphaFold), genomics (AlphaGenome), and tabular records.',
    },
  ],
};
