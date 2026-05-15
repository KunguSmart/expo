import { NativeModule, registerWebModule, SharedObject } from 'expo';

import type {
  CrashReport,
  ExpoAppMetricsModuleType,
  LogEventOptions,
  LogRecord,
  Metric,
  MetricAttributes,
  Session,
  SessionType,
} from './types';

export * from './types';

class WebSession extends SharedObject {
  readonly id: string = '';
  readonly type: SessionType = 'unknown';
  readonly startDate: string = new Date(0).toISOString();
  readonly endDate: string | null = null;

  async getMetrics(): Promise<Metric[]> {
    return [];
  }
  async getLogs(): Promise<LogRecord[]> {
    return [];
  }
  async addMetric(_metric: Metric): Promise<void> {}
  async getCrashReport(): Promise<CrashReport | null> {
    return null;
  }
}

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  async markFirstRender() {}
  async markInteractive(_attributes?: MetricAttributes) {}
  logEvent(_name: string, _options?: LogEventOptions) {}
  async getStoredEntries() {
    return [];
  }
  async clearStoredEntries() {}
  async getAllSessions(): Promise<Session[]> {
    return [];
  }
  simulateCrashReport() {}
  triggerCrash() {}
  async getMainSession(): Promise<Session | null> {
    return null;
  }
  Session = WebSession as unknown as typeof Session;
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
