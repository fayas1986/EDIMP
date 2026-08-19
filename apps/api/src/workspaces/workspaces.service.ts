import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
import { RequestUser } from '../common/auth/auth.guard';
import { PaginationQueryDto, PaginatedResult, Workspace } from '@edimp/contracts';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createWorkspaceDto: CreateWorkspaceDto, user: RequestUser): Promise<Workspace> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      include: { members: { where: { userId: user.id } } },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    if (tenant.members.length === 0) {
      throw new ForbiddenException(`You do not have access to Tenant ${tenantId}`);
    }

    const existing = await this.prisma.workspace.findFirst({
      where: { tenantId, name: createWorkspaceDto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Workspace with this name already exists in this tenant');
    }

    return this.prisma.workspace.create({
      data: {
        name: createWorkspaceDto.name,
        tenantId,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });
  }

  async findAll(tenantId: string, user: RequestUser, query?: PaginationQueryDto): Promise<Workspace[] | PaginatedResult<Workspace>> {
    const tenantMember = await this.prisma.tenantMember.findFirst({
      where: { tenantId, userId: user.id },
    });

    if (!tenantMember) {
      throw new ForbiddenException(`You do not have access to Tenant ${tenantId}`);
    }

    const where = {
      tenantId,
      deletedAt: null,
      members: {
        some: { userId: user.id },
      },
    };

    if (!query?.page && !query?.pageSize) {
      return this.prisma.workspace.findMany({ where });
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.workspace.count({ where }),
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

  async findOne(tenantId: string, id: string, user: RequestUser): Promise<any> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found in Tenant ${tenantId}`);
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException(`You do not have access to Workspace ${id}`);
    }

    return workspace;
  }

  async update(tenantId: string, id: string, updateWorkspaceDto: UpdateWorkspaceDto, user: RequestUser): Promise<Workspace> {
    const workspace = await this.findOne(tenantId, id, user);

    const member = workspace.members[0];
    if (member.role !== 'OWNER' && member.role !== 'EDITOR') {
      throw new ForbiddenException(`You must be an OWNER or EDITOR to update Workspace ${id}`);
    }

    if (updateWorkspaceDto.name) {
      const existing = await this.prisma.workspace.findFirst({
        where: { tenantId, name: updateWorkspaceDto.name, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Workspace with this name already exists in this tenant');
      }
    }

    return this.prisma.workspace.update({
      where: { id },
      data: { ...updateWorkspaceDto },
    });
  }

  async remove(tenantId: string, id: string, user: RequestUser): Promise<Workspace> {
    const workspace = await this.findOne(tenantId, id, user);

    const member = workspace.members[0];
    if (member.role !== 'OWNER') {
      throw new ForbiddenException(`You must be an OWNER to delete Workspace ${id}`);
    }

    return this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
