import type { components } from '@shared/api/backbone';
import { ApplicationUsage, ClientBreakdown, HeatCell, HourBucket, UsagePoint, UsageSummary } from './usage-report.model';

type Schemas = components['schemas'];

/**
 * Compile-time contract with backbone-rest: the hand-written models must stay assignable to (and from) the types generated from
 * its OpenAPI document (`pnpm run api:types`). If backbone renames or retypes a field, this file stops compiling.
 */
describe('usage report models match the OpenAPI contract of backbone-rest', () => {
  it('has the same shape as the generated schemas', () => {
    const summary: UsageSummary = {} as Schemas['UsageSummaryTO'] as UsageSummary;
    const point: UsagePoint = {} as Schemas['UsagePointTO'] as UsagePoint;
    const hour: HourBucket = {} as Schemas['HourBucketTO'] as HourBucket;
    const heat: HeatCell = {} as Schemas['HeatCellTO'] as HeatCell;
    const app: ApplicationUsage = {} as Schemas['ApplicationUsageTO'] as ApplicationUsage;
    const client: ClientBreakdown = {} as Schemas['ClientBreakdownTO'] as ClientBreakdown;

    const keys = (o: object) => Object.keys(o).length;
    expect([summary, point, hour, heat, app, client].every((m) => keys(m) === 0)).toBeTrue();
  });
});
