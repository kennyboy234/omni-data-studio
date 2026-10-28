import { Dataset } from '../types';
import { profileDataset } from './profiler';
import { sha256Sync, canonicalizeDatasetRows } from './cryptoIntegrity';
import { generateOneMillionRowDataset } from './chunkedUploader';

function generateHash(data: Record<string, any>[]): string {
  return sha256Sync(canonicalizeDatasetRows(data));
}

// 1. SaaS Customer Churn & Lifetime Value
function createSaaSDataset(): Record<string, any>[] {
  const plans = ['Starter', 'Professional', 'Enterprise', 'Scale'];
  const data: Record<string, any>[] = [];

  const baseDates = [
    '2024-01-15', '2024-02-01', '2024-02-20', '2024-03-10', '2024-04-05',
    '2024-05-18', '2024-06-22', '2024-07-09', '2024-08-14', '2024-09-01'
  ];

  for (let i = 1; i <= 150; i++) {
    const plan = plans[i % plans.length];
    const tenureMonths = Math.floor(Math.random() * 36) + 1;
    const monthlySpend =
      plan === 'Starter'
        ? 49 + Math.floor(Math.random() * 20)
        : plan === 'Professional'
        ? 199 + Math.floor(Math.random() * 60)
        : plan === 'Enterprise'
        ? 799 + Math.floor(Math.random() * 200)
        : 1499 + Math.floor(Math.random() * 500);

    const loginFrequencyDays = Math.floor(Math.random() * 28) + 1;
    const supportTickets = Math.floor(Math.random() * 7);
    const npsScore = i % 14 === 0 ? null : Math.floor(Math.random() * 11); // Some missing values
    const seatsUsed = Math.floor(Math.random() * 25) + 1;
    
    // Realistic churn logic with noise
    const churnProb =
      (supportTickets > 3 ? 0.35 : 0.05) +
      (loginFrequencyDays < 5 ? 0.3 : 0.05) +
      (npsScore !== null && npsScore < 6 ? 0.25 : 0.0) -
      (tenureMonths > 18 ? 0.15 : 0);
    const churned = Math.random() < Math.max(0.05, Math.min(0.9, churnProb)) ? 1 : 0;

    data.push({
      customer_id: `CUST-${1000 + i}`,
      signup_date: baseDates[i % baseDates.length],
      plan_tier: plan,
      tenure_months: tenureMonths,
      monthly_spend: monthlySpend,
      seats_used: seatsUsed,
      login_frequency_per_month: loginFrequencyDays,
      support_tickets_raised: supportTickets,
      nps_score: npsScore,
      churned: churned,
    });
  }
  return data;
}

// 2. E-Commerce Sales & Margin Performance
function createEcommerceDataset(): Record<string, any>[] {
  const categories = ['Electronics', 'Home & Kitchen', 'Apparel', 'Fitness', 'Office'];
  const regions = ['North America', 'EMEA', 'APAC', 'LATAM'];
  const data: Record<string, any>[] = [];

  for (let i = 1; i <= 160; i++) {
    const category = categories[i % categories.length];
    const region = regions[(i * 3) % regions.length];
    const units = Math.floor(Math.random() * 18) + 1;
    const unitPrice =
      category === 'Electronics'
        ? 150 + Math.floor(Math.random() * 250)
        : category === 'Home & Kitchen'
        ? 45 + Math.floor(Math.random() * 80)
        : category === 'Apparel'
        ? 28 + Math.floor(Math.random() * 50)
        : category === 'Fitness'
        ? 65 + Math.floor(Math.random() * 120)
        : 22 + Math.floor(Math.random() * 40);

    const discountPct = Number((Math.random() * 0.25).toFixed(2));
    const grossRevenue = units * unitPrice;
    const netRevenue = Number((grossRevenue * (1 - discountPct)).toFixed(2));
    const costOfGoods = Number((netRevenue * (0.45 + Math.random() * 0.2)).toFixed(2));
    const profitMargin = Number(((netRevenue - costOfGoods) / netRevenue).toFixed(3));
    const customerRating = i % 17 === 0 ? null : Number((3.0 + Math.random() * 2.0).toFixed(1));

    const day = (i % 28) + 1;
    const month = (i % 12) + 1;
    const dateStr = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    data.push({
      order_id: `ORD-${5000 + i}`,
      order_date: dateStr,
      product_category: category,
      region: region,
      units_sold: units,
      unit_price: unitPrice,
      discount_pct: discountPct,
      net_revenue: netRevenue,
      profit_margin: profitMargin,
      customer_rating: customerRating,
    });
  }
  return data;
}

// 3. Financial Credit Risk & Default Probability
function createCreditDataset(): Record<string, any>[] {
  const purposes = ['Debt Consolidation', 'Home Improvement', 'Small Business', 'Vehicle', 'Education'];
  const data: Record<string, any>[] = [];

  for (let i = 1; i <= 150; i++) {
    const age = 21 + Math.floor(Math.random() * 48);
    const annualIncome = 32000 + Math.floor(Math.random() * 110000);
    const creditScore = 520 + Math.floor(Math.random() * 320);
    const debtToIncome = Number((0.1 + Math.random() * 0.45).toFixed(3));
    const loanAmount = 4000 + Math.floor(Math.random() * 42000);
    const employmentYears = Math.min(Math.floor((age - 18) * 0.6), Math.floor(Math.random() * 22));
    const purpose = purposes[i % purposes.length];
    
    // Default risk formula
    const riskFactor =
      (creditScore < 620 ? 0.4 : 0.05) +
      (debtToIncome > 0.38 ? 0.3 : 0.05) +
      (annualIncome < 45000 ? 0.2 : 0) -
      (employmentYears > 8 ? 0.15 : 0);
    const defaulted = Math.random() < Math.max(0.04, Math.min(0.85, riskFactor)) ? 1 : 0;

    data.push({
      applicant_id: `APP-${8800 + i}`,
      age: age,
      annual_income: annualIncome,
      credit_score: creditScore,
      debt_to_income: debtToIncome,
      loan_amount: loanAmount,
      employment_years: employmentYears,
      loan_purpose: purpose,
      defaulted: defaulted,
    });
  }
  return data;
}

// 4. Healthcare Clinical Outcomes & Readmission
function createHealthcareDataset(): Record<string, any>[] {
  const conditions = ['None', 'Hypertension', 'Type 2 Diabetes', 'Cardiovascular', 'COPD'];
  const data: Record<string, any>[] = [];

  for (let i = 1; i <= 140; i++) {
    const age = 30 + Math.floor(Math.random() * 58);
    const bmi = Number((19.5 + Math.random() * 18.5).toFixed(1));
    const systolicBp = 105 + Math.floor(Math.random() * 65);
    const fastingGlucose = 75 + Math.floor(Math.random() * 140);
    const lengthOfStayDays = Math.floor(Math.random() * 14) + 1;
    const chronicCondition = conditions[i % conditions.length];

    const readmitRisk =
      (age > 65 ? 0.25 : 0.05) +
      (lengthOfStayDays > 7 ? 0.25 : 0.05) +
      (chronicCondition !== 'None' ? 0.2 : 0) +
      (systolicBp > 145 ? 0.15 : 0);
    const readmitted = Math.random() < Math.max(0.05, Math.min(0.88, readmitRisk)) ? 1 : 0;

    data.push({
      patient_id: `PAT-${3000 + i}`,
      age: age,
      bmi: bmi,
      systolic_blood_pressure: systolicBp,
      fasting_glucose_mg_dl: fastingGlucose,
      length_of_stay_days: lengthOfStayDays,
      primary_chronic_condition: chronicCondition,
      readmitted_30d: readmitted,
    });
  }
  return data;
}

export function getSampleDatasets(): Dataset[] {
  const saasRows = createSaaSDataset();
  const saasProfile = profileDataset(saasRows);

  const ecomRows = createEcommerceDataset();
  const ecomProfile = profileDataset(ecomRows);

  const creditRows = createCreditDataset();
  const creditProfile = profileDataset(creditRows);

  const healthRows = createHealthcareDataset();
  const healthProfile = profileDataset(healthRows);

  const oneMillionDs = generateOneMillionRowDataset();

  return [
    {
      id: 'ds_saas_churn',
      name: 'SaaS Customer Subscriptions & Churn',
      version: 1,
      isImmutableSource: true,
      sourceType: 'sample',
      sha256Hash: generateHash(saasRows),
      createdAt: '2026-03-01T10:00:00Z',
      data: saasRows,
      profile: saasProfile,
      columns: Object.keys(saasRows[0] || {}),
    },
    {
      id: 'ds_ecom_margin',
      name: 'E-Commerce Omnichannel Sales & Margin',
      version: 1,
      isImmutableSource: true,
      sourceType: 'sample',
      sha256Hash: generateHash(ecomRows),
      createdAt: '2026-03-02T11:00:00Z',
      data: ecomRows,
      profile: ecomProfile,
      columns: Object.keys(ecomRows[0] || {}),
    },
    {
      id: 'ds_credit_risk',
      name: 'Financial Credit Underwriting & Default',
      version: 1,
      isImmutableSource: true,
      sourceType: 'sample',
      sha256Hash: generateHash(creditRows),
      createdAt: '2026-03-03T09:30:00Z',
      data: creditRows,
      profile: creditProfile,
      columns: Object.keys(creditRows[0] || {}),
    },
    {
      id: 'ds_clinical_health',
      name: 'Healthcare Vitals & 30-Day Readmission',
      version: 1,
      isImmutableSource: true,
      sourceType: 'sample',
      sha256Hash: generateHash(healthRows),
      createdAt: '2026-03-04T14:15:00Z',
      data: healthRows,
      profile: healthProfile,
      columns: Object.keys(healthRows[0] || {}),
    },
    {
      id: oneMillionDs.id,
      name: 'Exascale Planetary Sensor Grid (1,000,000 Records)',
      version: 1,
      isImmutableSource: true,
      sourceType: 'sample',
      sha256Hash: oneMillionDs.sha256Hash,
      createdAt: oneMillionDs.createdAt,
      data: oneMillionDs.data,
      profile: oneMillionDs.profile,
      columns: oneMillionDs.columns,
    },
  ];
}
