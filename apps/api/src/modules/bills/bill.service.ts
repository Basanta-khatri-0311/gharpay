
import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../lib/errors.js';
import type { CreateBillInput, UpdateBillInput } from './bill.schema.js';

const billSelect = {
  id: true,
  billingMonth: true,
  dueDate: true,
  status: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      type: true,
      description: true,
      amount: true,
    },
  },
  tenancy: {
    select: {
      id: true,
      renter: { select: { id: true, name: true, email: true, phone: true } },
      unit: {
        select: {
          id: true,
          name: true,
          property: { select: { id: true, name: true, landlordId: true } },
        },
      },
    },
  },
} as const;

async function ensureTenancyOwnership(
  landlordId: string,
  tenancyId: string,
): Promise<void> {
  const tenancy = await prisma.tenancy.findFirst({
    where: {
      id: tenancyId,
      unit: { property: { landlordId } },
    },
    select: { id: true },
  });

  if (!tenancy) {
    throw new NotFoundError('Tenancy not found');
  }
}

async function ensureBillOwnership(
  landlordId: string,
  billId: string,
): Promise<void> {
  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      tenancy: { unit: { property: { landlordId } } },
    },
    select: { id: true },
  });

  if (!bill) {
    throw new NotFoundError('Bill not found');
  }
}

export async function createBill(landlordId: string, input: CreateBillInput) {
  await ensureTenancyOwnership(landlordId, input.tenancyId);

  const duplicate = await prisma.bill.findFirst({
    where: {
      tenancyId: input.tenancyId,
      billingMonth: input.billingMonth,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new BadRequestError('A bill for this tenancy and billing month already exists');
  }

  const totalAmount = input.items
    .reduce((sum, item) => sum + Number(item.amount), 0)
    .toFixed(2);

  return prisma.bill.create({
    data: {
      tenancyId: input.tenancyId,
      billingMonth: input.billingMonth,
      dueDate: input.dueDate,
      totalAmount,
      items: {
        create: input.items.map((item) => ({
          type: item.type,
          description: item.description,
          amount: item.amount,
        })),
      },
    },
    select: billSelect,
  });
}

export async function listBills(landlordId: string, tenancyId?: string) {
  return prisma.bill.findMany({
    where: {
      tenancy: {
        unit: { property: { landlordId } },
        ...(tenancyId ? { id: tenancyId } : {}),
      },
    },
    select: billSelect,
    orderBy: { billingMonth: 'desc' },
  });
}

export async function getBill(landlordId: string, billId: string) {
  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      tenancy: { unit: { property: { landlordId } } },
    },
    select: billSelect,
  });

  if (!bill) {
    throw new NotFoundError('Bill not found');
  }

  return bill;
}

export async function updateBill(
  landlordId: string,
  billId: string,
  input: UpdateBillInput,
) {
  await ensureBillOwnership(landlordId, billId);

  const result = await prisma.bill.updateMany({
    where: {
      id: billId,
      tenancy: { unit: { property: { landlordId } } },
    },
    data: input,
  });

  if (result.count === 0) {
    throw new NotFoundError('Bill not found');
  }

  return prisma.bill.findFirstOrThrow({
    where: { id: billId },
    select: billSelect,
  });
}
