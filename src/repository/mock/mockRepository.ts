import { prisma } from "@/lib/prisma"
import { AppError } from "@/types/error/AppError"

export class MockRepository {
    async pingDB(): Promise<void> {
        try {
            await prisma.$queryRaw`SELECT 1`
        } catch (error) {
            console.error("Error pinging DB:", error)
            throw new AppError("Failed to ping DB", 404)
        }
    }
}
