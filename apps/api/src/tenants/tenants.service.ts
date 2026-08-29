import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { RequestUser } from '../common/auth/auth.guard';
import { PaginationQueryDto, PaginatedResult, Tenant } from '@edimp/contracts';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto, user: RequestUser): Promise<Tenant> {
    const existing = await this.prisma.tenant.findFirst({
      where: { name: createTenantDto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Tenant with this name already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
    });

    return tenant;
  }

  async findAll(user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<Tenant>> {
    const where = {
      deletedAt: null,
      members: {
        some: {
          userId: user.id,
        },
      },
    };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if ((tenant as any).members.length === 0) {
      throw new ForbiddenException(`You do not have access to Tenant ${id}`);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt,
    };
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, user: RequestUser): Promise<Tenant> {
    const tenant = await this.findOne(id, user);

    const member = (tenant as any).members[0];
    if (member.role !== 'ADMIN') {
      throw new ForbiddenException(`You must be an ADMIN to update Tenant ${id}`);
    }

    if (updateTenantDto.name) {
      const existing = await this.prisma.tenant.findFirst({
        where: { name: updateTenantDto.name, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Tenant with this name already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { ...updateTenantDto },
    });
  }

  async remove(id: string, user: RequestUser): Promise<Tenant> {
    const tenant = await this.findOne(id, user);

    const member = (tenant as any).members[0];
    if (member.role !== 'ADMIN') {
      throw new ForbiddenException(`You must be an ADMIN to delete Tenant ${id}`);
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
