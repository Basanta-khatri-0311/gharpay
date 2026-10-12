
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from './payment-method.schema.js';

const paymentMethodSelect = {
  id: true,
  type: true,
  name: true,
  accountName: true,
  accountNumber: true,
  phoneNumber: true,
  qrImageUrl: true,
  instructions: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function ensureOwnership(landlordId: string, paymentMethodId: string): Promise<void> {
  const method = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, landlordId },
    select: { id: true },
  });

  if (!method) {
    throw new NotFoundError('Payment method not found');
  }
}

// ─── Landlord: manage own payment methods ────────────────────────────────────

export async function createPaymentMethod(
  landlordId: string,
  input: CreatePaymentMethodInput,
) {
  return prisma.paymentMethod.create({
    data: { landlordId, ...input },
    select: paymentMethodSelect,
  });
}

export async function listPaymentMethods(landlordId: string) {
  return prisma.paymentMethod.findMany({
    where: { landlordId },
    select: paymentMethodSelect,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPaymentMethod(landlordId: string, paymentMethodId: string) {
  const method = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, landlordId },
    select: paymentMethodSelect,
  });

  if (!method) {
    throw new NotFoundError('Payment method not found');
  }

  return method;
}

export async function updatePaymentMethod(
  landlordId: string,
  paymentMethodId: string,
  input: UpdatePaymentMethodInput,
) {
  await ensureOwnership(landlordId, paymentMethodId);

  const result = await prisma.paymentMethod.updateMany({
    where: { id: paymentMethodId, landlordId },
    data: input,
  });

  if (result.count === 0) {
    throw new NotFoundError('Payment method not found');
  }

  return prisma.paymentMethod.findFirstOrThrow({
    where: { id: paymentMethodId, landlordId },
    select: paymentMethodSelect,
  });
}

export async function deletePaymentMethod(landlordId: string, paymentMethodId: string) {
  await ensureOwnership(landlordId, paymentMethodId);

  await prisma.paymentMethod.delete({
    where: { id: paymentMethodId },
  });
}

// ─── Renter: view active payment methods for a landlord ──────────────────────
// Renters need to know where to send money before submitting a payment

export async function listActiveMethodsForLandlord(landlordId: string) {
  return prisma.paymentMethod.findMany({
    where: { landlordId, active: true },
    select: paymentMethodSelect,
    orderBy: { type: 'asc' },
  });
}
