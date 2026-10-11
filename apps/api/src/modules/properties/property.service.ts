
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
} from './property.schema.js';

const propertySelect = {
  id: true,
  name: true,
  address: true,
  city: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createProperty(
  landlordId: string,
  input: CreatePropertyInput,
) {
  return prisma.property.create({
    data: {
      landlordId,
      name: input.name,
      address: input.address,
      city: input.city,
    },
    select: propertySelect,
  });
}

export async function listProperties(landlordId: string) {
  return prisma.property.findMany({
    where: { landlordId },
    select: {
      ...propertySelect,
      _count: {
        select: { units: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProperty(
  landlordId: string,
  propertyId: string,
) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId,
    },
    select: {
      ...propertySelect,
      units: {
        select: {
          id: true,
          name: true,
          type: true,
          monthlyRent: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  return property;
}

export async function updateProperty(
  landlordId: string,
  propertyId: string,
  input: UpdatePropertyInput,
) {
  const result = await prisma.property.updateMany({
    where: {
      id: propertyId,
      landlordId,
    },
    data: input,
  });

  if (result.count === 0) {
    throw new NotFoundError('Property not found');
  }

  return prisma.property.findFirstOrThrow({
    where: {
      id: propertyId,
      landlordId,
    },
    select: propertySelect,
  });
}
