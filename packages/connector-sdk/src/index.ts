export interface ConnectorCapabilities {
  supportsExtract: boolean;
  supportsLoad: boolean;
  supportsUpsert: boolean;
  supportsStreaming: boolean;
  supportsPagination: boolean;
  supportsCDC: boolean;
  maxBatchSize: number;
}

export interface ConnectionConfig {
  connectionId: string;
  connectorType: string;
  vaultPath?: string;
  decryptedSecret?: string;
  configOptions?: Record<string, any>;
}

export interface DiscoveredSchema {
  entityName: string;
  entityType: string;
  fields: {
    fieldName: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
    description?: string;
  }[];
  recordCount?: number;
}

export interface ExtractOptions {
  entityName: string;
  limit?: number;
  offset?: number;
  cursor?: string;
  sinceTimestamp?: Date;
}

export interface LoadOptions {
  entityName: string;
  records: Record<string, any>[];
  strategy?: 'INSERT' | 'UPSERT' | 'MERGE';
  primaryKeys?: string[];
}

export interface ConnectorHealth {
  isHealthy: boolean;
  latencyMs: number;
  statusMessage: string;
  lastChecked: Date;
}

export interface BaseConnector {
  testConnection(config: ConnectionConfig): Promise<boolean>;
  discover(config: ConnectionConfig): Promise<DiscoveredSchema[]>;
  profile(config: ConnectionConfig, entityName: string): Promise<Record<string, any>>;
  count(config: ConnectionConfig, entityName: string): Promise<number>;
  extract(config: ConnectionConfig, options: ExtractOptions): Promise<Record<string, any>[]>;
  paginate(config: ConnectionConfig, options: ExtractOptions): Promise<{ data: Record<string, any>[]; nextCursor?: string; hasMore: boolean }>;
  load(config: ConnectionConfig, options: LoadOptions): Promise<{ inserted: number; updated: number; failed: number }>;
  upsert(config: ConnectionConfig, options: LoadOptions): Promise<{ inserted: number; updated: number; failed: number }>;
  healthCheck(config: ConnectionConfig): Promise<ConnectorHealth>;
  getCapabilities(): ConnectorCapabilities;
}

export abstract class AbstractConnector implements BaseConnector {
  abstract testConnection(config: ConnectionConfig): Promise<boolean>;
  abstract discover(config: ConnectionConfig): Promise<DiscoveredSchema[]>;
  abstract profile(config: ConnectionConfig, entityName: string): Promise<Record<string, any>>;
  abstract count(config: ConnectionConfig, entityName: string): Promise<number>;
  abstract extract(config: ConnectionConfig, options: ExtractOptions): Promise<Record<string, any>[]>;
  abstract paginate(config: ConnectionConfig, options: ExtractOptions): Promise<{ data: Record<string, any>[]; nextCursor?: string; hasMore: boolean }>;
  abstract load(config: ConnectionConfig, options: LoadOptions): Promise<{ inserted: number; updated: number; failed: number }>;
  abstract upsert(config: ConnectionConfig, options: LoadOptions): Promise<{ inserted: number; updated: number; failed: number }>;
  abstract healthCheck(config: ConnectionConfig): Promise<ConnectorHealth>;
  abstract getCapabilities(): ConnectorCapabilities;
}
