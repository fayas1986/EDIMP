import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnvironmentDto, UpdateEnvironmentDto } from './dto/environment.dto';
import { RequestUser } from '../common/auth/auth.guard';
import { PaginationQueryDto, PaginatedResult, Environment } from '@edimp/contracts';

@Injectable()
export class EnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, createEnvironmentDto: CreateEnvironmentDto, user: RequestUser): Promise<Environment> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      include: { members: { where: { userId: user.id } } },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException(`You do not have access to Workspace ${workspaceId}`);
    }

    const existing = await this.prisma.environment.findFirst({
      where: { workspaceId, name: createEnvironmentDto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Environment with this name already exists in this workspace');
    }

    return this.prisma.environment.create({
      data: {
        name: createEnvironmentDto.name,
        workspaceId,
      },
    });
  }

  async findAll(workspaceId: string, user: RequestUser, query?: PaginationQueryDto): Promise<Environment[] | PaginatedResult<Environment>> {
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (!workspaceMember) {
      throw new ForbiddenException(`You do not have access to Workspace ${workspaceId}`);
    }

    const where = {
      workspaceId,
      deletedAt: null,
    };

    if (!query?.page && !query?.pageSize) {
      return this.prisma.environment.findMany({ where });
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.environment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.environment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async findOne(workspaceId: string, id: string, user: RequestUser): Promise<Environment> {
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (!workspaceMember) {
      throw new ForbiddenException(`You do not have access to Workspace ${workspaceId}`);
    }

    const environment = await this.prisma.environment.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });

    if (!environment) {
      throw new NotFoundException(`Environment ${id} not found in Workspace ${workspaceId}`);
    }

    return environment;
  }

  async update(workspaceId: string, id: string, updateEnvironmentDto: UpdateEnvironmentDto, user: RequestUser): Promise<Environment> {
    const environment = await this.findOne(workspaceId, id, user);

    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (workspaceMember?.role !== 'OWNER' && workspaceMember?.role !== 'EDITOR') {
      throw new ForbiddenException(`You must be an OWNER or EDITOR to update Environment ${id}`);
    }

    if (updateEnvironmentDto.name) {
      const existing = await this.prisma.environment.findFirst({
        where: { workspaceId, name: updateEnvironmentDto.name, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Environment with this name already exists in this workspace');
      }
    }

    return this.prisma.environment.update({
      where: { id },
      data: { ...updateEnvironmentDto },
    });
  }

  async remove(workspaceId: string, id: string, user: RequestUser): Promise<Environment> {
    const environment = await this.findOne(workspaceId, id, user);

    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (workspaceMember?.role !== 'OWNER') {
      throw new ForbiddenException(`You must be an OWNER to delete Environment ${id}`);
    }

    return this.prisma.environment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
