import { SignJWT } from 'jose';

import { env } from '../../config/env.js';

const accessTokenSecret = new TextEncoder().encode(
  env.JWT_ACCESS_SECRET,
);

export async function createAccessToken(user: {
  id: string;
  role: 'LANDLORD' | 'RENTER';
}) {
  return new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessTokenSecret);
}