export type HealthStatus = 'pass' | 'fail' | 'skip';

export interface HealthCheckResult {
  check: string;
  status: HealthStatus;
  duration: number;
  detail?: string;
}

export type HealthCheckFn = () => Promise<Omit<HealthCheckResult, 'duration' | 'check'>>;

export interface HealthCheckDef {
  name: string;
  run: HealthCheckFn;
}
