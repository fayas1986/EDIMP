import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export interface SecretsProvider {
  getSecret(vaultPath: string): Promise<string>;
  setSecret(vaultPath: string, secretValue: string): Promise<void>;
  deleteSecret(vaultPath: string): Promise<void>;
}

@Injectable()
export class SecretsService implements SecretsProvider, OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);
  private azureClient?: SecretClient;
  private localMockStore = new Map<string, string>();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const vaultUrl = this.configService.get<string>('AZURE_KEYVAULT_URL') || this.configService.get<string>('KEYVAULT_URL');
    if (vaultUrl) {
      try {
        const credential = new DefaultAzureCredential();
        this.azureClient = new SecretClient(vaultUrl, credential);
        this.logger.log(`Initialized Azure Key Vault SecretsProvider for vault: ${vaultUrl}`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize Azure Key Vault client: ${err?.message}`);
      }
    } else {
      this.logger.log('AZURE_KEYVAULT_URL not configured. Operating in Local Environment Secrets Provider mode.');
    }
  }

  async getSecret(vaultPath: string): Promise<string> {
    if (!vaultPath) {
      throw new Error('Secret vault path is required.');
    }

    if (this.azureClient) {
      try {
        const secretName = this.normalizeKeyVaultName(vaultPath);
        const response = await this.azureClient.getSecret(secretName);
        if (response.value) {
          return response.value;
        }
      } catch (err: any) {
        this.logger.warn(`Azure Key Vault secret resolution failed for '${vaultPath}': ${err?.message}. Falling back to env/local store.`);
      }
    }

    const envKey = vaultPath.toUpperCase().replace(/[^A_Z0_9]/g, '_');
    const envVal = this.configService.get<string>(envKey) || this.configService.get<string>(vaultPath);
    if (envVal) {
      return envVal;
    }

    if (this.localMockStore.has(vaultPath)) {
      return this.localMockStore.get(vaultPath)!;
    }

    return `mock-decrypted-secret-value-for-${vaultPath}`;
  }

  async setSecret(vaultPath: string, secretValue: string): Promise<void> {
    if (this.azureClient) {
      const secretName = this.normalizeKeyVaultName(vaultPath);
      await this.azureClient.setSecret(secretName, secretValue);
      this.logger.log(`Secret '${secretName}' stored in Azure Key Vault.`);
      return;
    }

    this.localMockStore.set(vaultPath, secretValue);
  }

  async deleteSecret(vaultPath: string): Promise<void> {
    if (this.azureClient) {
      const secretName = this.normalizeKeyVaultName(vaultPath);
      const poller = await this.azureClient.beginDeleteSecret(secretName);
      await poller.pollUntilDone();
      this.logger.log(`Secret '${secretName}' deleted from Azure Key Vault.`);
      return;
    }

    this.localMockStore.delete(vaultPath);
  }

  private normalizeKeyVaultName(vaultPath: string): string {
    return vaultPath.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '');
  }
}
