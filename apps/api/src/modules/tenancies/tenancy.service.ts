import { prisma } from '../../lib/prisma.js';
import {
  NotFoundError,
  BadRequestError,
} from '../../lib/errors.js';
import type { CreateTenancyInput } from './tenancy.schema.js';

const tenancySelect = {
  id: true,
  startDate: true,
  endDate: true,
  active: true,
  createdAt: true,
  renter: { select: { id: true, name: true, email: true, phone: true } },
  unit: {
    select: {
      id: true,
      name: true,
      monthlyRent: true,
      property: { select: { id: true, name: true, landlordId: true } },
    },
  },
};

export async function createTenancy(
  landlordId: string,
  input: CreateTenancyInput,
) {
  return prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({
      where: {
        id: input.unitId,
        property: { landlordId },
      },
      select: { id: true, status: true },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    if (unit.status !== 'VACANT') {
      throw new BadRequestError('Unit is already occupied');
    }

    const renter = await tx.user.findFirst({
      where: {
        id: input.renterId,
        role: 'RENTER',
      },
      select: { id: true },
    });

    if (!renter) {
      throw new NotFoundError('Renter not found');
    }

    const existingTenancy = await tx.tenancy.findFirst({
      where: {
        unitId: input.unitId,
        active: true,
      },
      select: { id: true },
    });

    if (existingTenancy) {
      throw new BadRequestError('Unit already has an active tenancy');
    }

    const tenancy = await tx.tenancy.create({
      data: {
        unitId: input.unitId,
        renterId: input.renterId,
        startDate: input.startDate,
        endDate: input.endDate,
        active: true,
      },
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true },
        },
        unit: {
          select: {
            id: true,
            name: true,
            monthlyRent: true,
            propertyId: true,
          },
        },
      },
    });

    await tx.unit.update({
      where: { id: input.unitId },
      data: { status: 'OCCUPIED' },
    });

    return tenancy;
  });
}

export async function listTenancies(landlordId: string, unitId?: string) {
  return prisma.tenancy.findMany({
    where: {
      unit: {
        property: { landlordId },
        ...(unitId ? { id: unitId } : {}),
      },
    },
    select: tenancySelect,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTenancy(landlordId: string, tenancyId: string) {
  const tenancy = await prisma.tenancy.findFirst({
    where: {
      id: tenancyId,
      unit: { property: { landlordId } },
    },
    select: tenancySelect,
  });

  if (!tenancy) throw new NotFoundError('Tenancy not found');

  return tenancy;
}

export async function endTenancy(landlordId: string, tenancyId: string) {
  return prisma.$transaction(async (tx) => {
    const tenancy = await tx.tenancy.findFirst({
      where: {
        id: tenancyId,
        unit: { property: { landlordId } },
      },
      select: { id: true, active: true, unitId: true },
    });

    if (!tenancy) throw new NotFoundError('Tenancy not found');
    if (!tenancy.active) throw new BadRequestError('Tenancy is already ended');

    const updated = await tx.tenancy.update({
      where: { id: tenancyId },
      data: { active: false, endDate: new Date() },
      select: tenancySelect,
    });

    await tx.unit.update({
      where: { id: tenancy.unitId },
      data: { status: 'VACANT' },
    });

    return updated;
  });
}