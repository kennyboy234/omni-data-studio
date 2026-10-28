/**
 * ====================================================================
 * OMNIDATA STUDIO: STATISTICAL METHOD REGISTRY (SECTIONS 16, APP A & B)
 * Single Source of Truth for SPSS-Style and EViews-Style Methods
 * ====================================================================
 */

export type MethodSource = 'spss-style' | 'eviews-style' | 'both';
export type MethodStatus = 'working' | 'partial' | 'simulated' | 'planned';
export type MethodTier = 'Tier A' | 'Tier B' | 'Tier C';

export interface StatisticalAssumption {
  name: string;
  testMethod: string;
  ruleDescription: string;
  threshold: string;
}

export interface StatisticalMethodRecord {
  id: string;
  name: string;
  family: string;
  source: MethodSource;
  tier: MethodTier;
  status: MethodStatus;
  menuPath: string[]; // e.g. ['Analyze', 'Compare Means', 'Independent-Samples T Test']
  shortDescription: string;
  formulaLatex: string;
  textbookReference: string;
  assumptions: StatisticalAssumption[];
  inputs: {
    requiredVariables: string;
    measurementLevels: ('nominal' | 'ordinal' | 'scale')[];
    minSampleSize: number;
    timeSeriesRequired?: boolean;
  };
  optionsWithDefaults: Record<string, string | number | boolean>;
  outputsExpected: string[];
  noviceInterpretation: string;
  proTechnicalNote: string;
  judgeGuards: string[];
}

export const STATISTICAL_METHODS_REGISTRY: StatisticalMethodRecord[] = [
  // ===================================================================
  // TIER A: SPSS-STYLE METHODS (Working)
  // ===================================================================
  {
    id: 'spss_ttest_indep',
    name: 'Independent-Samples T Test (Student & Welch)',
    family: 'Compare Means',
    source: 'spss-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['Analyze', 'Compare Means', 'Independent-Samples T Test...'],
    shortDescription: 'Tests for equality of two independent population means with Levene variance test and Welch robust correction.',
    formulaLatex: 't_{Welch} = \\frac{\\bar{X}_1 - \\bar{X}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}, \\quad df = \\frac{\\left(\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}\\right)^2}{\\frac{(s_1^2/n_1)^2}{n_1 - 1} + \\frac{(s_2^2/n_2)^2}{n_2 - 1}}',
    textbookReference: 'Field, A. (2018). Discovering Statistics Using IBM SPSS Statistics (5th ed., pp. 367-399). SAGE.',
    assumptions: [
      { name: 'Normality', testMethod: 'Shapiro-Wilk / Skewness z-score', ruleDescription: 'Values in each group should approximate a normal distribution.', threshold: '|z| < 2.58' },
      { name: 'Homogeneity of Variance', testMethod: "Levene's Test (F)", ruleDescription: 'Equality of variances between groups. If violated (p < .05), report Welch t.', threshold: 'p >= 0.05' },
      { name: 'Independence', testMethod: 'Design verification', ruleDescription: 'Observations must be sampled independently across groups.', threshold: 'Durbin-Watson ~ 2.0' },
    ],
    inputs: {
      requiredVariables: '1 continuous scale test variable, 1 binary categorical grouping variable',
      measurementLevels: ['scale', 'nominal'],
      minSampleSize: 10,
    },
    optionsWithDefaults: {
      confidenceInterval: 0.95,
      varianceAssumption: 'auto_levene',
      missingValues: 'exclude_cases_analysis_by_analysis',
      effectSize: 'cohens_d_and_hedges_g',
    },
    outputsExpected: ["Group Statistics (N, Mean, Std. Dev, Std. Error Mean)", "Levene's Test for Equality of Variances (F, Sig.)", "t-test for Equality of Means (t, df, Sig. 2-tailed, Mean Diff, Std Error Diff, 95% CI)", "Effect Size Point Estimate & CI"],
    noviceInterpretation: 'Determines whether the difference in averages between two groups is real or likely caused by random chance.',
    proTechnicalNote: 'Reports both Student equal-variances pooled t and Welch-Satterthwaite unequal variances t-statistic with Cohen d standardized mean difference.',
    judgeGuards: ['Check Levene test significance before accepting equal-variance p-value', 'Flag small subgroup sample sizes (n < 5)', 'Ensure grouping variable has exactly 2 distinct levels'],
  },
  {
    id: 'spss_oneway_anova',
    name: 'One-Way Analysis of Variance (ANOVA)',
    family: 'Compare Means',
    source: 'spss-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['Analyze', 'Compare Means', 'One-Way ANOVA...'],
    shortDescription: 'Tests for differences among three or more group means with post-hoc tests (Tukey HSD, Bonferroni, Games-Howell) and effect sizes.',
    formulaLatex: 'F = \\frac{MS_{Between}}{MS_{Within}} = \\frac{\\sum n_j (\\bar{X}_j - \\bar{X})^2 / (k - 1)}{\\sum \\sum (X_{ij} - \\bar{X}_j)^2 / (N - k)}, \\quad \\eta^2 = \\frac{SS_{Between}}{SS_{Total}}',
    textbookReference: 'Field, A. (2018). Discovering Statistics Using IBM SPSS Statistics (5th ed., pp. 433-470). SAGE.',
    assumptions: [
      { name: 'Normality of Residuals', testMethod: 'Residual distribution checks', ruleDescription: 'Group residuals should be normally distributed.', threshold: '|skewness| < 2.0' },
      { name: 'Homoscedasticity', testMethod: "Levene's Test", ruleDescription: 'Homogeneity of variance across all k levels.', threshold: 'p >= 0.05' },
    ],
    inputs: {
      requiredVariables: '1 dependent scale variable, 1 categorical factor variable (>= 2 levels)',
      measurementLevels: ['scale', 'nominal'],
      minSampleSize: 15,
    },
    optionsWithDefaults: {
      postHocTest: 'tukey_hsd',
      equalVarianceViolatedTest: 'games_howell',
      effectSizes: 'eta_squared_and_omega_squared',
      significanceAlpha: 0.05,
    },
    outputsExpected: ['Descriptives by Factor', 'ANOVA Summary Table (Sum of Squares, df, Mean Square, F, Sig.)', 'Levene Homogeneity Test', 'Post-Hoc Pairwise Comparisons Matrix', 'Effect Size Measures (Eta-squared, Omega-squared)'],
    noviceInterpretation: 'Checks if at least one group average differs significantly from the others, and pinpoints which pairs differ.',
    proTechnicalNote: 'Includes both unadjusted eta-squared and less-biased omega-squared, accompanied by Tukey HSD or Games-Howell pairwise adjustments.',
    judgeGuards: ['Enforce Games-Howell if Levene test fails', 'Verify multiple comparisons familywise error rate adjustment', 'Flag severely unbalanced group sizes'],
  },
  {
    id: 'spss_crosstabs_chisq',
    name: 'Crosstabs & Chi-Square Test of Independence',
    family: 'Descriptive Statistics',
    source: 'spss-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['Analyze', 'Descriptive Statistics', 'Crosstabs...'],
    shortDescription: 'Bivariate contingency table analysis with Pearson Chi-Square, Likelihood Ratio, Fisher Exact, Cramér’s V, and Odds Ratios.',
    formulaLatex: '\\chi^2 = \\sum_{i=1}^r \\sum_{j=1}^c \\frac{(O_{ij} - E_{ij})^2}{E_{ij}}, \\quad E_{ij} = \\frac{R_i C_j}{N}, \\quad V = \\sqrt{\\frac{\\chi^2}{N \\cdot \\min(r-1, c-1)}}',
    textbookReference: 'Agresti, A. (2013). Categorical Data Analysis (3rd ed., pp. 73-102). Wiley.',
    assumptions: [
      { name: 'Expected Cell Frequencies', testMethod: 'Cochran rule check', ruleDescription: 'No expected frequencies < 1, and no more than 20% of cells < 5.', threshold: '< 20% cells < 5' },
      { name: 'Sampling Independence', testMethod: 'Study design check', ruleDescription: 'Each subject belongs to exactly one row and one column.', threshold: 'Pass' },
    ],
    inputs: {
      requiredVariables: '1 row categorical variable, 1 column categorical variable',
      measurementLevels: ['nominal', 'ordinal'],
      minSampleSize: 20,
    },
    optionsWithDefaults: {
      displayPercentages: 'row_col_total',
      residuals: 'standardized_and_adjusted',
      associationMeasures: 'cramers_v_phi_odds_ratio',
    },
    outputsExpected: ['Contingency Crosstabulation Matrix', 'Chi-Square Tests Table (Pearson Chi-Square, Continuity Correction, Likelihood Ratio, Fisher Exact)', 'Symmetric Measures (Phi, Cramér’s V)', 'Risk Estimate (Odds Ratio for 2x2)'],
    noviceInterpretation: 'Identifies whether two category variables are statistically associated or independent.',
    proTechnicalNote: 'Computes adjusted standardized residuals to pinpoint specific cells contributing to significant omnibus chi-square deviations.',
    judgeGuards: ['Flag warning when > 20% of expected counts are below 5', 'Require Fisher Exact test for 2x2 tables with low cell counts'],
  },
  {
    id: 'spss_scale_reliability',
    name: "Reliability Analysis (Cronbach's Alpha)",
    family: 'Scale',
    source: 'spss-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['Analyze', 'Scale', 'Reliability Analysis...'],
    shortDescription: 'Evaluates internal consistency reliability for survey scales and multi-item instruments.',
    formulaLatex: '\\alpha = \\frac{k}{k - 1} \\left(1 - \\frac{\\sum_{i=1}^k \\sigma_{y_i}^2}{\\sigma_x^2}\\right)',
    textbookReference: 'Field, A. (2018). Discovering Statistics Using IBM SPSS Statistics (5th ed., pp. 817-840). SAGE.',
    assumptions: [
      { name: 'Unidimensionality', testMethod: 'Inter-item correlation inspection', ruleDescription: 'Items should measure the same underlying construct.', threshold: 'Positive mean r' },
      { name: 'Tau-equivalence', testMethod: 'Equal item-true score variance', ruleDescription: 'Item loadings onto construct are approximately equal.', threshold: 'Standardized scale' },
    ],
    inputs: {
      requiredVariables: '>= 2 scale or ordinal survey items',
      measurementLevels: ['scale', 'ordinal'],
      minSampleSize: 30,
    },
    optionsWithDefaults: {
      model: 'alpha',
      itemTotalStats: true,
      scaleIfItemDeleted: true,
      interItemCorrelations: true,
    },
    outputsExpected: ['Reliability Statistics (Cronbach’s Alpha, Alpha Based on Standardized Items, N of Items)', 'Item Statistics (Mean, Std. Dev, N)', 'Item-Total Statistics (Scale Mean if Item Deleted, Corrected Item-Total Correlation, Cronbach’s Alpha if Item Deleted)'],
    noviceInterpretation: 'Tests whether a group of survey questions work together reliably to measure the same idea (0.70+ is good, 0.80+ is great).',
    proTechnicalNote: 'Calculates corrected item-total correlations and identifies problematic items whose deletion markedly increases scale alpha.',
    judgeGuards: ['Flag negative item-total correlations indicative of unreversed coding', 'Warn if alpha < 0.60'],
  },

  // ===================================================================
  // TIER A: EVIEWS-STYLE METHODS (Working)
  // ===================================================================
  {
    id: 'eviews_ols_hac',
    name: 'Least Squares Regression with White & Newey-West HAC Covariance',
    family: 'Equation Estimation',
    source: 'eviews-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['Quick', 'Estimate Equation...', 'Least Squares (LS / NLS)'],
    shortDescription: 'Linear regression with heteroskedasticity-consistent (White HC0/HC1) and autocorrelation-consistent (Newey-West HAC) covariance matrices.',
    formulaLatex: '\\hat{\\beta} = (X^T X)^{-1} X^T y, \\quad \\hat{V}_{HAC} = (X^T X)^{-1} \\left(\\sum_{t=1}^T e_t^2 x_t x_t^T + \\sum_{j=1}^m w_j \\sum_{t=j+1}^T (x_t e_t e_{t-j} x_{t-j}^T + x_{t-j} e_{t-j} e_t x_t^T)\\right) (X^T X)^{-1}',
    textbookReference: 'Wooldridge, J. M. (2016). Introductory Econometrics: A Modern Approach (6th ed., pp. 411-447). Cengage.',
    assumptions: [
      { name: 'No Multicollinearity', testMethod: 'Variance Inflation Factor (VIF)', ruleDescription: 'Independent variables must not be perfectly or excessively correlated.', threshold: 'VIF < 10.0' },
      { name: 'Homoskedasticity', testMethod: 'White Test / Breusch-Pagan', ruleDescription: 'Error variance must be constant across fitted values.', threshold: 'p >= 0.05' },
      { name: 'No Serial Correlation', testMethod: 'Durbin-Watson / Breusch-Godfrey LM', ruleDescription: 'Residuals must not exhibit time autocorrelation.', threshold: 'DW ~ 2.0, LM p >= 0.05' },
    ],
    inputs: {
      requiredVariables: '1 dependent scale series, >= 1 independent scale series (or constant)',
      measurementLevels: ['scale'],
      minSampleSize: 20,
    },
    optionsWithDefaults: {
      covarianceMethod: 'newey_west_hac',
      hacBandwidth: 'auto_newey_west_fixed',
      includeConstant: true,
      confidenceInterval: 0.95,
    },
    outputsExpected: ['Estimation Output Table (Variable, Coefficient, Std. Error, t-Statistic, Prob.)', 'Regression Summary (R-squared, Adjusted R-squared, S.E. of regression, Sum squared resid, Log likelihood, F-statistic, Prob(F-statistic))', 'Information Criteria (Akaike info criterion, Schwarz criterion, Hannan-Quinn criterion)', 'Time-series Diagnostics (Durbin-Watson stat, Mean dependent var, S.D. dependent var)'],
    noviceInterpretation: 'Models how predictor variables affect an outcome while automatically fixing distorted standard errors caused by volatility or time dependencies.',
    proTechnicalNote: 'Constructs EViews-standard output block including White and Newey-West Bartlett kernel HAC adjustments, preserving coefficient unbiasedness under Gauss-Markov violations.',
    judgeGuards: ['Audit VIF and flag severe multicollinearity (VIF > 10)', 'Verify Durbin-Watson statistic and auto-recommend HAC when DW < 1.5 or DW > 2.5', 'Report sample size after lag loss'],
  },
  {
    id: 'eviews_residual_diagnostics',
    name: 'Equation Residual Diagnostics (Breusch-Godfrey LM, White, Jarque-Bera, Ramsey RESET)',
    family: 'Equation Diagnostics',
    source: 'eviews-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['View', 'Residual Diagnostics', 'Serial Correlation / Heteroskedasticity / Normality'],
    shortDescription: 'Comprehensive econometric diagnostic suite testing serial correlation, heteroskedasticity, non-normality, and model misspecification.',
    formulaLatex: 'LM = T \\cdot R_{aux}^2 \\sim \\chi^2(p), \\quad JB = \\frac{N}{6}\\left(S^2 + \\frac{(K - 3)^2}{4}\\right) \\sim \\chi^2(2)',
    textbookReference: 'Greene, W. H. (2018). Econometric Analysis (8th ed., pp. 643-690). Pearson.',
    assumptions: [
      { name: 'Residual Normality', testMethod: 'Jarque-Bera (JB)', ruleDescription: 'Residual skewness = 0 and kurtosis = 3.', threshold: 'JB p >= 0.05' },
      { name: 'No Serial Correlation up to p lags', testMethod: 'Breusch-Godfrey LM test', ruleDescription: 'Auxiliary regression of residuals on lagged residuals.', threshold: 'LM p >= 0.05' },
      { name: 'No Heteroskedasticity', testMethod: 'White test (no cross terms)', ruleDescription: 'Auxiliary regression on fitted squared terms.', threshold: 'White p >= 0.05' },
    ],
    inputs: {
      requiredVariables: 'Fitted econometric model residuals and design matrix',
      measurementLevels: ['scale'],
      minSampleSize: 20,
    },
    optionsWithDefaults: {
      breuschGodfreyLags: 2,
      whiteIncludeCrossTerms: false,
      ramseyFittedPowers: 2,
    },
    outputsExpected: ['Breusch-Godfrey Serial Correlation LM Test (F-stat, Obs*R-squared, Prob. Chi-Square)', 'White Heteroskedasticity Test (F-stat, Obs*R-squared, Scaled explained SS)', 'Jarque-Bera Normality Test (Skewness, Kurtosis, JB Stat, Probability)', 'Ramsey RESET Specification Test (t-stat, F-stat, Likelihood ratio)'],
    noviceInterpretation: 'Health check for your regression: proves whether the model assumptions hold or if predictions will be misleading.',
    proTechnicalNote: 'Executes auxiliary regressions to compute Breusch-Godfrey LM, White no-cross-terms, and Ramsey RESET polynomial expansions.',
    judgeGuards: ['Escalate to human if both heteroskedasticity and autocorrelation fail without HAC correction', 'Flag misspecification when Ramsey RESET p < 0.01'],
  },
  {
    id: 'eviews_unit_root_adf',
    name: 'Augmented Dickey-Fuller (ADF) Unit Root & Stationarity Test',
    family: 'Series Views & Tests',
    source: 'eviews-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['View', 'Unit Root Tests', 'Augmented Dickey-Fuller (ADF)...'],
    shortDescription: 'Tests for presence of unit root in time-series series against stationary alternative using MacKinnon response surface critical values.',
    formulaLatex: '\\Delta y_t = \\alpha + \\beta t + \\gamma y_{t-1} + \\sum_{i=1}^p \\delta_i \\Delta y_{t-i} + \\epsilon_t, \\quad H_0: \\gamma = 0 \\text{ (Non-stationary)}',
    textbookReference: 'Enders, W. (2014). Applied Econometric Time Series (4th ed., pp. 206-240). Wiley.',
    assumptions: [
      { name: 'White Noise Errors', testMethod: 'Lag augmentation', ruleDescription: 'Sufficient lags included to purge serial correlation from error term.', threshold: 'AIC / SIC minimization' },
    ],
    inputs: {
      requiredVariables: '1 continuous time-series column',
      measurementLevels: ['scale'],
      minSampleSize: 25,
      timeSeriesRequired: true,
    },
    optionsWithDefaults: {
      testEquation: 'intercept', // 'intercept' | 'trend_and_intercept' | 'none'
      lagSelectionCriterion: 'sic', // 'aic' | 'sic' | 'fixed'
      maxLags: 4,
    },
    outputsExpected: ['ADF Test Statistic & MacKinnon Critical Values (1%, 5%, 10%)', 'Stationarity Conclusion (Stationary I(0) vs Non-Stationary I(1))', 'Lag Length Selected & Auxiliary Regression Table'],
    noviceInterpretation: 'Determines whether a timeline series has an unpredictable drift/trend (unit root) or stably fluctuates around a steady mean.',
    proTechnicalNote: 'Compares calculated tau-statistic against MacKinnon (1996) finite-sample critical values for constant, trend, or driftless specifications.',
    judgeGuards: ['Strictly block spurious regressions: flag any regression of non-stationary series that lack cointegration', 'Auto-recommend first differencing if I(1)'],
  },
  {
    id: 'eviews_forecast_evaluation',
    name: 'Forecast Accuracy & Theil Inequality Decomposition',
    family: 'Forecasting',
    source: 'eviews-style',
    tier: 'Tier A',
    status: 'working',
    menuPath: ['Forecast', 'Forecast Evaluation & Theil Decomposition...'],
    shortDescription: 'Quantifies out-of-sample prediction accuracy with RMSE, MAE, MAPE, SMAPE, and Theil inequality coefficient bias/variance proportions.',
    formulaLatex: 'U = \\frac{\\sqrt{\\frac{1}{T}\\sum_{t=1}^T (\\hat{y}_t - y_t)^2}}{\\sqrt{\\frac{1}{T}\\sum_{t=1}^T \\hat{y}_t^2} + \\sqrt{\\frac{1}{T}\\sum_{t=1}^T y_t^2}}, \\quad U^M + U^S + U^C = 1',
    textbookReference: 'Hamilton, J. D. (1994). Time Series Analysis (pp. 43-48). Princeton University Press.',
    assumptions: [
      { name: 'Aligned Out-of-Sample Horizon', testMethod: 'Date/Index matching', ruleDescription: 'Actual and forecast vectors must span identical time steps.', threshold: 'Exact match' },
    ],
    inputs: {
      requiredVariables: '1 actual time-series vector, 1 predicted/forecast vector',
      measurementLevels: ['scale'],
      minSampleSize: 10,
    },
    optionsWithDefaults: {
      theilDecomposition: 'covariance_proportion',
      includePercentageMetrics: true,
    },
    outputsExpected: ['Root Mean Squared Error (RMSE)', 'Mean Absolute Error (MAE)', 'Mean Absolute Percentage Error (MAPE)', 'Theil Inequality Coefficient (U)', 'Bias Proportion (UM)', 'Variance / Variance-Covariance Proportions (US, UC)'],
    noviceInterpretation: 'Scores how well forecasts performed against reality and diagnoses whether errors stem from systematic bias or random spread.',
    proTechnicalNote: 'Computes Theil inequality index bounded in [0, 1] alongside Mean Proportion (systematic error), Variance Proportion, and Covariance Proportion.',
    judgeGuards: ['Flag high Bias Proportion (UM > 0.20) as indication of systematic model under- or over-prediction', 'Ensure sample size matches post-split horizon'],
  },

  // ===================================================================
  // TIER B: PLANNED / PARTIAL CATALOG ENTRIES (From Appendix A & B)
  // ===================================================================
  {
    id: 'spss_glm_factorial',
    name: 'General Linear Model: Factorial & Univariate ANOVA/ANCOVA',
    family: 'General Linear Model',
    source: 'spss-style',
    tier: 'Tier B',
    status: 'partial',
    menuPath: ['Analyze', 'General Linear Model', 'Univariate...'],
    shortDescription: 'Factorial ANOVA and ANCOVA with interaction terms, custom contrasts, covariate adjustments, and Type III sums of squares.',
    formulaLatex: 'y_{ijk} = \\mu + \\alpha_i + \\beta_j + (\\alpha\\beta)_{ij} + \\gamma(x_{ijk} - \\bar{x}) + \\epsilon_{ijk}',
    textbookReference: 'Tabachnick, B. G., & Fidell, L. S. (2019). Using Multivariate Statistics (7th ed.). Pearson.',
    assumptions: [{ name: 'Homogeneity of regression slopes in ANCOVA', testMethod: 'Interaction test', ruleDescription: 'Covariate effect is uniform across treatment groups.', threshold: 'p >= 0.05' }],
    inputs: { requiredVariables: '1 dependent scale variable, >= 1 factors, optional scale covariates', measurementLevels: ['scale', 'nominal'], minSampleSize: 30 },
    optionsWithDefaults: { sumOfSquaresType: 'Type III', postHoc: 'bonferroni' },
    outputsExpected: ['Tests of Between-Subjects Effects', 'Estimated Marginal Means', 'Custom Contrasts'],
    noviceInterpretation: 'Examines the effect of multiple categories and control variables on an outcome at the same time.',
    proTechnicalNote: 'Applies full QR decomposition with Type III orthogonal parameterizations and covariate centering.',
    judgeGuards: ['Check homogeneity of slopes before running ANCOVA', 'Warn on severe cell imbalance in factorial designs'],
  },
  {
    id: 'eviews_var_lag_select',
    name: 'Vector Autoregression (VAR) & Lag Structure Tests',
    family: 'VAR and System Methods',
    source: 'eviews-style',
    tier: 'Tier B',
    status: 'partial',
    menuPath: ['Quick', 'Estimate VAR...', 'Vector Autoregression'],
    shortDescription: 'Multi-equation dynamic time-series modeling with information criteria lag selection (AIC, SIC, HQ) and Granger causality.',
    formulaLatex: 'Y_t = c + A_1 Y_{t-1} + \\dots + A_p Y_{t-p} + \\epsilon_t',
    textbookReference: 'Lütkepohl, H. (2005). New Introduction to Multiple Time Series Analysis. Springer.',
    assumptions: [{ name: 'System Stationarity', testMethod: 'Roots of characteristic polynomial', ruleDescription: 'All AR roots must lie strictly inside unit circle.', threshold: '|z| < 1.0' }],
    inputs: { requiredVariables: '>= 2 scale time-series vectors', measurementLevels: ['scale'], minSampleSize: 40, timeSeriesRequired: true },
    optionsWithDefaults: { varType: 'standard_unrestricted', maxLagSearch: 8 },
    outputsExpected: ['VAR Coefficient Matrix & T-stats', 'VAR Lag Order Selection Criteria Table', 'Granger Causality Block Exogeneity Tests', 'Cholesky Impulse Response Functions'],
    noviceInterpretation: 'Studies how multiple financial or economic variables feed back into and influence each other over time.',
    proTechnicalNote: 'Estimates equation-by-equation OLS system with residual covariance matrix cross-correlation diagnostics.',
    judgeGuards: ['Enforce stability condition: reject VAR if any characteristic root >= 1.0', 'Enforce sample size verification for degrees of freedom'],
  },
  {
    id: 'eviews_arch_garch',
    name: 'GARCH(1,1) Volatility Modeling',
    family: 'Equation Estimation',
    source: 'eviews-style',
    tier: 'Tier B',
    status: 'partial',
    menuPath: ['Quick', 'Estimate Equation...', 'ARCH - Autoregressive Conditional Heteroskedasticity'],
    shortDescription: 'Estimates time-varying volatility clustering with Bollerslev Generalized Autoregressive Conditional Heteroskedasticity.',
    formulaLatex: '\\sigma_t^2 = \\omega + \\alpha \\epsilon_{t-1}^2 + \\beta \\sigma_{t-1}^2, \\quad \\alpha + \\beta < 1',
    textbookReference: 'Bollerslev, T. (1986). Generalized autoregressive conditional heteroskedasticity. Journal of Econometrics, 31(3), 307-327.',
    assumptions: [{ name: 'ARCH Effects in Residuals', testMethod: 'ARCH-LM Test', ruleDescription: 'Raw residuals must exhibit significant volatility clustering.', threshold: 'p < 0.05' }],
    inputs: { requiredVariables: '1 continuous financial returns series', measurementLevels: ['scale'], minSampleSize: 100, timeSeriesRequired: true },
    optionsWithDefaults: { archOrder: 1, garchOrder: 1, distribution: 'student_t' },
    outputsExpected: ['Mean Equation Coefficients', 'Variance Equation Coefficients (omega, alpha, beta)', 'Volatility Persistence Metric (alpha + beta)', 'Conditional Variance Forecast Series'],
    noviceInterpretation: 'Captures and forecasts financial market volatility bursts and quiet periods.',
    proTechnicalNote: 'Maximizes log-likelihood using Berndt-Hall-Hall-Hausman (BHHH) numerical optimization; verifies alpha + beta < 1 for covariance stationarity.',
    judgeGuards: ['Reject if alpha + beta >= 1 (explosive conditional variance)', 'Require ARCH-LM pre-check before fitting'],
  },

  // ===================================================================
  // TIER C: PLANNED (Full Appendix A & B registry completeness)
  // ===================================================================
  {
    id: 'spss_kaplan_meier',
    name: 'Kaplan-Meier Survival Analysis',
    family: 'Survival',
    source: 'spss-style',
    tier: 'Tier C',
    status: 'planned',
    menuPath: ['Analyze', 'Survival', 'Kaplan-Meier...'],
    shortDescription: 'Nonparametric estimation of survival functions over time with Log-Rank, Breslow, and Tarone-Ware comparisons.',
    formulaLatex: '\\hat{S}(t) = \\prod_{t_i \\le t} \\left(1 - \\frac{d_i}{n_i}\\right)',
    textbookReference: 'Klein, J. P., & Moeschberger, M. L. (2003). Survival Analysis. Springer.',
    assumptions: [{ name: 'Independent Censoring', testMethod: 'Study design verification', ruleDescription: 'Censoring time is independent of survival time.', threshold: 'Protocol verified' }],
    inputs: { requiredVariables: '1 duration time variable, 1 binary status indicator', measurementLevels: ['scale', 'nominal'], minSampleSize: 20 },
    optionsWithDefaults: { compareFactorTest: 'log_rank' },
    outputsExpected: ['Survival Table', 'Mean and Median Survival Times', 'Survival Curve Coordinates', 'Log-Rank Test of Equality'],
    noviceInterpretation: 'Tracks time until an event occurs (e.g. customer churn or medical event) with incomplete records accounted for.',
    proTechnicalNote: 'Computes product-limit estimator with Greenwood variance formula for confidence limits.',
    judgeGuards: ['Ensure status indicator encodes event as 1 and censored as 0', 'Check for non-informative censoring assumption'],
  },
  {
    id: 'eviews_panel_fixed_effects',
    name: 'Panel Data Estimation: Fixed & Random Effects with Hausman Test',
    family: 'Panel Methods',
    source: 'eviews-style',
    tier: 'Tier C',
    status: 'planned',
    menuPath: ['Quick', 'Estimate Equation...', 'Panel - Fixed and Random Effects'],
    shortDescription: 'Cross-sectional time-series panel models with within-transformation, random effects GLS, and Hausman specification test.',
    formulaLatex: 'y_{it} = \\alpha_i + X_{it} \\beta + \\epsilon_{it}, \\quad H = (\\hat{\\beta}_{FE} - \\hat{\\beta}_{RE})^T (V_{FE} - V_{RE})^{-1} (\\hat{\\beta}_{FE} - \\hat{\\beta}_{RE}) \\sim \\chi^2(k)',
    textbookReference: 'Baltagi, B. H. (2021). Econometric Analysis of Panel Data (6th ed.). Springer.',
    assumptions: [{ name: 'Individual Effects Exogeneity in RE', testMethod: 'Hausman Test', ruleDescription: 'Covariance between individual effects and regressors is zero.', threshold: 'Hausman p >= 0.05' }],
    inputs: { requiredVariables: 'Panel identifier, Time identifier, 1 dependent series, >= 1 independent series', measurementLevels: ['nominal', 'scale'], minSampleSize: 50 },
    optionsWithDefaults: { effectsType: 'fixed_cross_section', covariance: 'white_period' },
    outputsExpected: ['Cross-section Fixed Effects Output', 'F-test for Redundant Fixed Effects', 'Hausman Specification Test Table'],
    noviceInterpretation: 'Analyzes data collected across multiple companies or countries over multiple years while controlling for unique traits.',
    proTechnicalNote: 'Computes demeaned within-estimator for FE and Swamy-Arora theta transformation for RE GLS.',
    judgeGuards: ['Enforce Fixed Effects whenever Hausman test p < 0.05', 'Audit panel balance and missing waves'],
  },
];

/**
 * Coverage Report helper for Section 16.1 compliance
 */
export function getMethodsCoverageSummary() {
  const total = STATISTICAL_METHODS_REGISTRY.length;
  const working = STATISTICAL_METHODS_REGISTRY.filter((m) => m.status === 'working').length;
  const partial = STATISTICAL_METHODS_REGISTRY.filter((m) => m.status === 'partial').length;
  const planned = STATISTICAL_METHODS_REGISTRY.filter((m) => m.status === 'planned').length;

  return {
    totalCatalogued: total,
    workingCount: working,
    partialCount: partial,
    plannedCount: planned,
    coveragePercent: Math.round((working / total) * 100),
    tierACount: STATISTICAL_METHODS_REGISTRY.filter((m) => m.tier === 'Tier A').length,
    tierBCount: STATISTICAL_METHODS_REGISTRY.filter((m) => m.tier === 'Tier B').length,
    tierCCount: STATISTICAL_METHODS_REGISTRY.filter((m) => m.tier === 'Tier C').length,
    spssCount: STATISTICAL_METHODS_REGISTRY.filter((m) => m.source === 'spss-style' || m.source === 'both').length,
    eviewsCount: STATISTICAL_METHODS_REGISTRY.filter((m) => m.source === 'eviews-style' || m.source === 'both').length,
  };
}
