
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type {
  CreateUnitInput,
  UpdateUnitInput,
} from './unit.schema.js';

const unitSelect = {
  id: true,
  propertyId: true,
  name: true,
  type: true,
  monthlyRent: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function ensurePropertyOwnership(
  landlordId: string,
  propertyId: string,
): Promise<void> {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId,
    },
    select: { id: true },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }
}

export async function createUnit(
  landlordId: string,
  propertyId: string,
  input: CreateUnitInput,
) {
  await ensurePropertyOwnership(landlordId, propertyId);

  return prisma.unit.create({
    data: {
      propertyId,
      name: input.name,
      type: input.type,
      monthlyRent: input.monthlyRent,
    },
    select: unitSelect,
  });
}

export async function listUnits(
  landlordId: string,
  propertyId: string,
) {
  await ensurePropertyOwnership(landlordId, propertyId);

  return prisma.unit.findMany({
    where: { propertyId },
    select: unitSelect,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUnit(
  landlordId: string,
  propertyId: string,
  unitId: string,
) {
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      propertyId,
      property: { landlordId },
    },
    select: unitSelect,
  });

  if (!unit) {
    throw new NotFoundError('Unit not found');
  }

  return unit;
}

export async function updateUnit(
  landlordId: string,
  propertyId: string,
  unitId: string,
  input: UpdateUnitInput,
) {
  const result = await prisma.unit.updateMany({
    where: {
      id: unitId,
      propertyId,
      property: { landlordId },
    },
    data: {
      ...input,
    },
  });

  if (result.count === 0) {
    throw new NotFoundError('Unit not found');
  }

  return prisma.unit.findFirstOrThrow({
    where: {
      id: unitId,
      propertyId,
      property: { landlordId },
    },
    select: unitSelect,
  });
}
