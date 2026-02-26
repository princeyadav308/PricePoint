import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load env variables BEFORE initializing Prisma
dotenv.config();

// Export a single, shared Prisma instance
export const prisma = new PrismaClient();
