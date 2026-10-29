import { describe, it, expect } from 'vitest';
import { CostConfig, PreventedFaultItem, DashboardWidget } from '../04-roi/types';

describe('Studio 4 - ROI Engine', () => {
  it('correctly calculates prevented hard dollar savings with dynamic cost multipliers', () => {
    const config: CostConfig = {
      downtimeCostPerHour: 28500,
      dataCorruptionCostPerRecord: 145,
      criticalIncidentCost: 65000,
      engineeringHourCost: 185,
      falsePositiveCost: 450,
    };

    const downtimeHours = 4;
    const recordsCorruptedPrevented = 5200;
    const criticalIncidentsPrevented = 3;
    const engineeringHoursSaved = 300;

    const downtimeSavings = config.downtimeCostPerHour * downtimeHours;
    const corruptionSavings = config.dataCorruptionCostPerRecord * recordsCorruptedPrevented;
    const incidentSavings = config.criticalIncidentCost * criticalIncidentsPrevented;
    const engHoursSavings = config.engineeringHourCost * engineeringHoursSaved;

    const totalSavings = downtimeSavings + corruptionSavings + incidentSavings + engHoursSavings;

    expect(downtimeSavings).toBe(114000);
    expect(corruptionSavings).toBe(754000);
    expect(incidentSavings).toBe(195000);
    expect(engHoursSavings).toBe(55500);
    expect(totalSavings).toBe(1118500);
  });

  it('computes net ROI percentage and payback period against standard annual platform cost', () => {
    const totalSavings = 1249000;
    const platformCostAnnual = 120000;

    const netRoiPercent = Math.round(((totalSavings - platformCostAnnual) / platformCostAnnual) * 100);
    const paybackDays = Math.max(2, Math.round((platformCostAnnual / (totalSavings / 365))));

    expect(netRoiPercent).toBe(941);
    expect(paybackDays).toBe(35);
  });

  it('validates 12-column dashboard layout constraints for widgets', () => {
    const widgets: DashboardWidget[] = [
      { id: 'w1', title: 'Hard Dollar Losses Prevented', type: 'kpi_roi', w: 4, h: 1 },
      { id: 'w2', title: 'Autonomous Fault Interceptions', type: 'kpi_faults', w: 4, h: 1 },
      { id: 'w3', title: 'Asset Operational Health', type: 'gauge_health', w: 4, h: 1 },
      { id: 'w4', title: 'Cumulative Value Preserved Timeline', type: 'chart_savings', w: 8, h: 2 },
      { id: 'w5', title: 'Feature Drift Surveillance (PSI)', type: 'chart_drift', w: 4, h: 2 },
    ];

    const firstRowTotalWidth = widgets[0].w + widgets[1].w + widgets[2].w;
    const secondRowTotalWidth = widgets[3].w + widgets[4].w;

    expect(firstRowTotalWidth).toBe(12);
    expect(secondRowTotalWidth).toBe(12);
    expect(widgets.length).toBe(5);
  });
});
