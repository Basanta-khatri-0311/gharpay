
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError, AppError } from '../../lib/errors.js';
import type { SendInvitationInput } from './invitation.schema.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const invitationSelect = {
  id: true,
  email: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  unit: {
    select: {
      id: true,
      name: true,
      type: true,
      monthlyRent: true,
      property: { select: { id: true, name: true, address: true, city: true } },
    },
  },
  sender: { select: { id: true, name: true, email: true } },
  recipient: { select: { id: true, name: true, email: true } },
} as const;

// ─── Token helpers (same pattern as refresh-token.service.ts) ─────────────────

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getExpiry(): Date {
  return new Date(Date.now() + INVITATION_TTL_MS);
}

// ─── Email stub ───────────────────────────────────────────────────────────────
// TODO: Integrate an email provider (e.g. Resend, Nodemailer + SMTP) here.
// The token is returned from sendInvitation so the caller can log or relay it
// during development.

async function sendInvitationEmail(
  _to: string,
  _token: string,
  _unitName: string,
  _landlordName: string,
): Promise<void> {
  // TODO: Send an email with a link like:
  // `${env.WEB_URL}/invitations/accept?token=${_token}`
  return;
}

// ─── Landlord: send invitation ────────────────────────────────────────────────

export async function sendInvitation(landlordId: string, input: SendInvitationInput) {
  // Verify unit belongs to this landlord
  const unit = await prisma.unit.findFirst({
    where: {
      id: input.unitId,
      property: { landlordId },
    },
    select: {
      id: true,
      name: true,
      status: true,
      property: { select: { landlordId: true } },
    },
  });

  if (!unit) throw new NotFoundError('Unit not found');

  if (unit.status === 'OCCUPIED') {
    throw new BadRequestError('Unit is already occupied');
  }

  // Block duplicate pending invitation to the same email + unit
  const existing = await prisma.invitation.findFirst({
    where: {
      unitId: input.unitId,
      email: input.email,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, 'INVITATION_ALREADY_PENDING', 'An active invitation already exists for this email and unit');
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = getExpiry();

  // Check if a renter account already exists for this email
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, role: true },
  });

  const recipientId = existingUser?.role === 'RENTER' ? existingUser.id : null;

  const invitation = await prisma.invitation.create({
    data: {
      unitId: input.unitId,
      senderId: landlordId,
      recipientId,
      email: input.email,
      tokenHash,
      expiresAt,
    },
    select: {
      ...invitationSelect,
      sender: { select: { id: true, name: true, email: true } },
    },
  });

  await sendInvitationEmail(
    input.email,
    rawToken,
    unit.name,
    invitation.sender.name,
  );

  // Return the raw token so it can be surfaced during development.
  // In production the token travels via email only — never in the API response.
  return {
    invitation,
    // TODO: Remove `devToken` once email delivery is wired up.
    devToken: rawToken,
  };
}

// ─── Landlord: list invitations ───────────────────────────────────────────────

export async function listInvitations(
  landlordId: string,
  unitId?: string,
  status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED',
) {
  return prisma.invitation.findMany({
    where: {
      senderId: landlordId,
      ...(unitId ? { unitId } : {}),
      ...(status ? { status } : {}),
    },
    select: invitationSelect,
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Landlord: cancel an invitation ──────────────────────────────────────────

export async function cancelInvitation(landlordId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, senderId: landlordId },
    select: { id: true, status: true },
  });

  if (!invitation) throw new NotFoundError('Invitation not found');

  if (invitation.status !== 'PENDING') {
    throw new BadRequestError(`Invitation is already ${invitation.status.toLowerCase()}`);
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'CANCELLED' },
    select: invitationSelect,
  });
}

// ─── Renter: accept an invitation via token ───────────────────────────────────

export async function acceptInvitation(renterId: string, rawToken: string) {
  const tokenHash = hashToken(rawToken);

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        unitId: true,
        email: true,
        status: true,
        expiresAt: true,
        unit: {
          select: {
            id: true,
            status: true,
            monthlyRent: true,
          },
        },
      },
    });

    if (!invitation) throw new NotFoundError('Invitation not found or invalid token');

    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestError('Invitation has already been accepted');
    }

    if (invitation.status === 'CANCELLED') {
      throw new BadRequestError('Invitation has been cancelled');
    }

    if (invitation.status === 'EXPIRED' || invitation.expiresAt <= new Date()) {
      // Lazily mark as EXPIRED if not already
      if (invitation.status === 'PENDING') {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
      }
      throw new BadRequestError('Invitation has expired');
    }

    if (invitation.unit.status === 'OCCUPIED') {
      throw new BadRequestError('Unit is no longer available');
    }

    // Verify the renter's email matches the invitation
    const renter = await tx.user.findUnique({
      where: { id: renterId },
      select: { id: true, email: true, role: true },
    });

    if (!renter || renter.role !== 'RENTER') {
      throw new BadRequestError('Only renter accounts can accept invitations');
    }

    if (renter.email !== invitation.email) {
      throw new BadRequestError('This invitation was sent to a different email address');
    }

    // Mark invitation accepted + link recipient
    const accepted = await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        recipientId: renterId,
      },
      select: invitationSelect,
    });

    return accepted;
  });
}

// ─── Renter: list own received invitations ────────────────────────────────────

export async function listRenterInvitations(renterId: string) {
  const renter = await prisma.user.findUnique({
    where: { id: renterId },
    select: { email: true },
  });

  if (!renter) throw new NotFoundError('User not found');

  return prisma.invitation.findMany({
    where: { email: renter.email },
    select: invitationSelect,
    orderBy: { createdAt: 'desc' },
  });
}
