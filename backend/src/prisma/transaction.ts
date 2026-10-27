import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/** Rejoue uniquement les conflits annulés par PostgreSQL, jamais un effet externe. */
export async function transactionSerializable<T>(prisma: PrismaService, operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let tentative = 0; ; tentative++) {
    try { return await prisma.$transaction(operation, { isolationLevel: 'Serializable', timeout: 10_000 }); }
    catch (error) { if ((error as { code?: string }).code !== 'P2034' || tentative >= 2) throw error; }
  }
}
