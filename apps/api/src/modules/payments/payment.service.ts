
import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../lib/errors.js';
import type { SubmitPaymentInput, RejectPaymentInput } from './payment.schema.js';

const paymentSelect = {
  id: true,
  amount: true,
  method: true,
  transactionReference: true,
  proofUrl: true,
  status: true,
  submittedAt: true,
  verifiedAt: true,
  bill: {
    select: {
      id: true,
      billingMonth: true,
      dueDate: true,
      totalAmount: true,
      tenancy: {
        select: {
          id: true,
          renter: { select: { id: true, name: true, email: true } },
          unit: {
            select: {
              id: true,
              name: true,
              property: { select: { id: true, name: true, landlordId: true } },
            },
          },
        },
      },
    },
  },
  verifiedBy: {
    select: { id: true, name: true },
  },
  receipt: {
    select: { id: true, receiptNumber: true, issuedAt: true },
  },
} as const;

function generateReceiptNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCP-${datePart}-${randomPart}`;
}

// ─── Renter: submit a payment ────────────────────────────────────────────────

export async function submitPayment(renterId: string, input: SubmitPaymentInput) {
  // Verify the bill belongs to an active tenancy owned by this renter
  const bill = await prisma.bill.findFirst({
    where: {
      id: input.billId,
      tenancy: { renterId, active: true },
    },
    select: { id: true, status: true, totalAmount: true },
  });

  if (!bill) {
    throw new NotFoundError('Bill not found');
  }

  if (bill.status === 'CANCELLED') {
    throw new BadRequestError('Cannot pay a cancelled bill');
  }

  if (bill.status === 'PAID') {
    throw new BadRequestError('Bill has already been paid');
  }

  // Prevent duplicate pending payments for the same bill
  const existingPending = await prisma.payment.findFirst({
    where: { billId: input.billId, status: 'PENDING' },
    select: { id: true },
  });

  if (existingPending) {
    throw new BadRequestError('A payment for this bill is already pending verification');
  }

  return prisma.payment.create({
    data: {
      billId: input.billId,
      amount: input.amount,
      method: input.method,
      transactionReference: input.transactionReference,
      proofUrl: input.proofUrl,
    },
    select: paymentSelect,
  });
}

// ─── Renter: list own payments ───────────────────────────────────────────────

export async function listRenterPayments(renterId: string, billId?: string) {
  return prisma.payment.findMany({
    where: {
      bill: {
        tenancy: { renterId },
        ...(billId ? { id: billId } : {}),
      },
    },
    select: paymentSelect,
    orderBy: { submittedAt: 'desc' },
  });
}

// ─── Landlord: list all payments across their properties ─────────────────────

export async function listLandlordPayments(
  landlordId: string,
  billId?: string,
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED',
) {
  return prisma.payment.findMany({
    where: {
      bill: {
        tenancy: { unit: { property: { landlordId } } },
        ...(billId ? { id: billId } : {}),
      },
      ...(status ? { status } : {}),
    },
    select: paymentSelect,
    orderBy: { submittedAt: 'desc' },
  });
}

// ─── Shared: get one payment ─────────────────────────────────────────────────

export async function getPayment(userId: string, role: 'LANDLORD' | 'RENTER', paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      ...(role === 'RENTER'
        ? { bill: { tenancy: { renterId: userId } } }
        : { bill: { tenancy: { unit: { property: { landlordId: userId } } } } }),
    },
    select: paymentSelect,
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  return payment;
}

// ─── Landlord: verify a payment ──────────────────────────────────────────────

export async function verifyPayment(landlordId: string, paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: paymentId,
        bill: { tenancy: { unit: { property: { landlordId } } } },
      },
      select: { id: true, status: true, billId: true },
    });

    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'PENDING') {
      throw new BadRequestError(`Payment is already ${payment.status.toLowerCase()}`);
    }

    // Mark payment as verified
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: landlordId,
      },
      select: paymentSelect,
    });

    // Mark bill as paid
    await tx.bill.update({
      where: { id: payment.billId },
      data: { status: 'PAID' },
    });

    // Issue a receipt
    await tx.receipt.create({
      data: {
        paymentId,
        receiptNumber: generateReceiptNumber(),
      },
    });

    return updated;
  });
}

// ─── Landlord: reject a payment ──────────────────────────────────────────────

export async function rejectPayment(
  landlordId: string,
  paymentId: string,
  _input: RejectPaymentInput,
) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      bill: { tenancy: { unit: { property: { landlordId } } } },
    },
    select: { id: true, status: true },
  });

  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status !== 'PENDING') {
    throw new BadRequestError(`Payment is already ${payment.status.toLowerCase()}`);
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'REJECTED' },
    select: paymentSelect,
  });
}
