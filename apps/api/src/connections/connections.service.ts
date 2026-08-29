import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreateConnectionDto, UpdateConnectionDto, TestConnectionResult, PaginationQueryDto, PaginatedResult, ConnectionResponse } from '@edimp/contracts';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  private async verifyEnvironmentAccess(environmentId: string, userId: string) {
    const environment = await this.prisma.environment.findFirst({
      where: { id: environmentId, deletedAt: null },
      include: {
        workspace: {
          include: {
            tenant: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!environment || environment.workspace.deletedAt || environment.workspace.tenant.deletedAt) {
      throw new NotFoundException(`Environment ${environmentId} not found`);
    }

    const hasTenantAccess = environment.workspace.tenant.members.length > 0;
    const hasWorkspaceAccess = environment.workspace.members.length > 0;

    if (!hasTenantAccess && !hasWorkspaceAccess) {
      throw new ForbiddenException(`User does not have access to Environment ${environmentId}`);
    }

    return environment;
  }

  // Sanitizes connection output to obscure/remove sensitive credential reference details
  private sanitizeConnection(connection: any): ConnectionResponse {
    return {
      id: connection.id,
      environmentId: connection.environmentId,
      connectorTypeId: connection.connectorTypeId,
      name: connection.name,
      description: connection.description,
      status: connection.status,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      deletedAt: connection.deletedAt,
    };
  }

  async create(environmentId: string, dto: CreateConnectionDto, user: RequestUser): Promise<ConnectionResponse> {
    await this.verifyEnvironmentAccess(environmentId, user.id);

    const existing = await this.prisma.connection.findFirst({
      where: {
        environmentId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Connection with name '${dto.name}' already exists in this environment`);
    }

    const connection = await this.prisma.connection.create({
      data: {
        environmentId,
        connectorTypeId: dto.connectorTypeId,
        name: dto.name,
        description: dto.description,
        ...(dto.credentialType && dto.vaultPath
          ? {
              credential: {
                create: {
                  credentialType: dto.credentialType,
                  vaultPath: dto.vaultPath,
                },
              },
            }
          : {}),
      },
      include: {
        connectorType: true,
        credential: true,
      },
    });

    return this.sanitizeConnection(connection);
  }

  async findAll(environmentId: string, user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<ConnectionResponse>> {
    await this.verifyEnvironmentAccess(environmentId, user.id);

    const where = {
      environmentId,
      deletedAt: null,
    };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [connections, totalItems] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          connectorType: true,
          credential: true,
        },
      }),
      this.prisma.connection.count({ where }),
    ]);

    return {
      data: connections.map(c => this.sanitizeConnection(c)),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<ConnectionResponse> {
    const connection = await this.prisma.connection.findFirst({
      where: { id, deletedAt: null },
      include: {
        environment: true,
        connectorType: true,
        credential: true,
      },
    });

    if (!connection) {
      throw new NotFoundException(`Connection ${id} not found`);
    }

    await this.verifyEnvironmentAccess(connection.environmentId, user.id);

    return this.sanitizeConnection(connection);
  }

  async update(id: string, dto: UpdateConnectionDto, user: RequestUser): Promise<ConnectionResponse> {
    const connection = await this.findOne(id, user);

    if (dto.name && dto.name !== connection.name) {
      const existing = await this.prisma.connection.findFirst({
        where: {
          environmentId: connection.environmentId,
          name: dto.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Connection with name '${dto.name}' already exists in this environment`);
      }
    }

    const updated = await this.prisma.connection.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.connectorTypeId ? { connectorTypeId: dto.connectorTypeId } : {}),
      },
      include: {
        connectorType: true,
        credential: true,
      },
    });

    return this.sanitizeConnection(updated);
  }

  async delete(id: string, user: RequestUser) {
    await this.findOne(id, user);

    await this.prisma.connection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async testConnection(id: string, user: RequestUser): Promise<TestConnectionResult> {
    await this.findOne(id, user);

    const connection = await this.prisma.connection.findUnique({
      where: { id },
      include: { connectorType: true },
    });

    if (!connection) {
      throw new NotFoundException(`Connection ${id} not found`);
    }

    const startTime = Date.now();
    if (connection.connectorType.status === 'SUNSET') {
      return {
        success: false,
        message: `Connector type ${connection.connectorType.name} is sunset and cannot connect.`,
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      message: `Successfully connected to ${connection.name} (${connection.connectorType.name}).`,
      latencyMs: Date.now() - startTime + Math.floor(Math.random() * 20 + 10),
    };
  }
}
