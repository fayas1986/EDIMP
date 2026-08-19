import { Injectable, Logger } from '@nestjs/common';

export interface DiscoveredField {
  name: string;
  dataType: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATETIME' | 'JSON' | 'UNKNOWN';
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export interface DiscoveredEntity {
  name: string;
  description?: string;
  fields: DiscoveredField[];
}

export interface ConnectorAdapter {
  discoverSchema(connectionConfig: any): Promise<DiscoveredEntity[]>;
}

export class PostgresAdapter implements ConnectorAdapter {
  async discoverSchema(connectionConfig: any): Promise<DiscoveredEntity[]> {
    // Simulated PostgreSQL schema discovery adapter
    return [
      {
        name: 'users',
        description: 'Discovered table: users',
        fields: [
          { name: 'id', dataType: 'STRING', isNullable: false, isPrimaryKey: true },
          { name: 'email', dataType: 'STRING', isNullable: false, isPrimaryKey: false },
          { name: 'created_at', dataType: 'DATETIME', isNullable: false, isPrimaryKey: false },
        ],
      },
      {
        name: 'orders',
        description: 'Discovered table: orders',
        fields: [
          { name: 'id', dataType: 'STRING', isNullable: false, isPrimaryKey: true },
          { name: 'user_id', dataType: 'STRING', isNullable: false, isPrimaryKey: false },
          { name: 'total_amount', dataType: 'FLOAT', isNullable: false, isPrimaryKey: false },
          { name: 'created_at', dataType: 'DATETIME', isNullable: false, isPrimaryKey: false },
        ],
      },
    ];
  }
}

export class SalesforceAdapter implements ConnectorAdapter {
  async discoverSchema(connectionConfig: any): Promise<DiscoveredEntity[]> {
    // Simulated Salesforce sObject schema discovery adapter
    return [
      {
        name: 'Account',
        description: 'Discovered sObject: Account',
        fields: [
          { name: 'Id', dataType: 'STRING', isNullable: false, isPrimaryKey: true },
          { name: 'Name', dataType: 'STRING', isNullable: false, isPrimaryKey: false },
          { name: 'Industry', dataType: 'STRING', isNullable: true, isPrimaryKey: false },
          { name: 'AnnualRevenue', dataType: 'FLOAT', isNullable: true, isPrimaryKey: false },
        ],
      },
      {
        name: 'Contact',
        description: 'Discovered sObject: Contact',
        fields: [
          { name: 'Id', dataType: 'STRING', isNullable: false, isPrimaryKey: true },
          { name: 'AccountId', dataType: 'STRING', isNullable: true, isPrimaryKey: false },
          { name: 'FirstName', dataType: 'STRING', isNullable: true, isPrimaryKey: false },
          { name: 'LastName', dataType: 'STRING', isNullable: false, isPrimaryKey: false },
        ],
      },
    ];
  }
}

@Injectable()
export class DataModelDiscoveryService {
  private readonly logger = new Logger(DataModelDiscoveryService.name);

  getAdapter(connectorTypeName: string): ConnectorAdapter {
    switch (connectorTypeName.toLowerCase()) {
      case 'salesforce':
        return new SalesforceAdapter();
      case 'postgres':
      case 'postgresql':
      default:
        return new PostgresAdapter();
    }
  }

  async discoverSchemaForConnection(connectorTypeName: string, connectionConfig: any): Promise<DiscoveredEntity[]> {
    this.logger.log(`Executing schema discovery via adapter for connector: ${connectorTypeName}`);
    const adapter = this.getAdapter(connectorTypeName);
    return adapter.discoverSchema(connectionConfig);
  }
}
