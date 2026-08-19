import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectorTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.connectorType.findMany({
      where: { status: 'ACTIVE' },
    });
  }

  async findOne(id: string) {
    const connectorType = await this.prisma.connectorType.findUnique({
      where: { id },
    });
    if (!connectorType) {
      throw new NotFoundException(`ConnectorType ${id} not found`);
    }
    return connectorType;
  }
}
