import { PrismaClient, Prisma } from "@prisma/client"
import { randomInt } from "crypto"
import { AppError } from "@/types/error/AppError"
import { BUSINESS_RULES } from "@/constant/systemConfig"
import { logger } from "@/utils/logger"

export interface ICodeRepository {
    generateUniqueCodeString(): Promise<string>

    createCode(data: {
        codeString: string
        targetRole: string
        activityName: string
        rewardCoin: number
        createdByUserId: string
        expiresAt: Date
    }): Promise<any>

    findCodeByString(codeString: string): Promise<any | null>

    findCodeWithCreator(codeString: string): Promise<any | null>

    checkIfUserRedeemedCode(userId: string, codeId: number): Promise<boolean>

    createRedemption(userId: string, codeId: number): Promise<any>

    updateWalletBalance(
        userId: string,
        newBalance: number
    ): Promise<any | null>

    getWalletByUserId(userId: string): Promise<any | null>

    createTransaction(data: {
        recipientUserId: string
        type: string
        coinAmount: number
        relatedCodeId: number
    }): Promise<any>

    getUserWithRole(userId: string): Promise<any | null>

    executeTransaction<T>(
        callback: (prisma: Prisma.TransactionClient) => Promise<T>
    ): Promise<T>
}

export class CodeRepository implements ICodeRepository {
    constructor(private prisma: PrismaClient) {}

    async generateUniqueCodeString(): Promise<string> {
        const MAX_RETRIES = BUSINESS_RULES.CODE_GENERATION.MAX_RETRIES
        let attempts = 0

        while (attempts < MAX_RETRIES) {
            attempts++

            // Cryptographically secure random generation
            // Generate 1 uppercase letter (A-Z) = 26 combinations
            const letterIndex = randomInt(0, 26)
            const letter = String.fromCharCode(65 + letterIndex)
            
            // Generate 3 digits (000-999) = 1,000 combinations
            const numbers = randomInt(0, 1000).toString().padStart(3, '0')
            
            // Total combinations = 26 × 1,000 = 26,000 possible codes
            const codeString = letter + numbers
            
            // Check if code already exists
            const existingCode = await this.findCodeByString(codeString)
            if (!existingCode) {
                return codeString
            }
            
            // Log warning เมื่อเริ่มมี collision บ่อย
            if (attempts > BUSINESS_RULES.CODE_GENERATION.WARNING_THRESHOLD) {
                logger.warn("CodeRepository", "Code generation collision detected", {
                    attempt: attempts,
                    maxRetries: MAX_RETRIES,
                    codeFormat: `${letter}${numbers}`
                })
            }
        }

        // If all attempts failed, use timestamp-based fallback for guaranteed uniqueness
        const timestamp = Date.now().toString().slice(-3) // Last 3 digits of timestamp
        const fallbackCode = `X${timestamp}` // X + 3 digit timestamp
        
        logger.warn("CodeRepository", "Code generation reached max retries, using fallback", {
            maxRetries: MAX_RETRIES,
            fallbackCode,
            timestamp
        })
        
        // Check if fallback code already exists (very unlikely)
        const existingFallback = await this.findCodeByString(fallbackCode)
        if (!existingFallback) {
            return fallbackCode
        }
        
        // If even fallback code exists, throw error
        throw new AppError(
            'Unable to generate unique code after maximum retries. Please try again or contact support.',
            500
        )
    }

    async createCode(data: {
        codeString: string
        targetRole: string
        activityName: string
        rewardCoin: number
        createdByUserId: string
        expiresAt: Date
    }): Promise<any> {
        const createData: any = {
            code_string: data.codeString,
            target_role: data.targetRole,
            activity_name: data.activityName,
            reward_coin: data.rewardCoin,
            expires_at: data.expiresAt,
            created_by_user_id: data.createdByUserId,
        }
        
        return await this.prisma.code.create({
            data: createData,
        })
    }

    async findCodeByString(codeString: string): Promise<any | null> {
        return await this.prisma.code.findUnique({
            where: { code_string: codeString },
        })
    }

    async findCodeWithCreator(
        codeString: string
    ): Promise<any | null> {
        return await this.prisma.code.findUnique({
            where: { code_string: codeString },
            include: { creator: true },
        })
    }

    async checkIfUserRedeemedCode(
        userId: string,
        codeId: number
    ): Promise<boolean> {
        const redemption = await this.prisma.codeRedemption.findUnique({
            where: {
                user_id_code_id: {
                    user_id: userId,
                    code_id: codeId,
                },
            },
        })
        return redemption !== null
    }

    async createRedemption(
        userId: string,
        codeId: number
    ): Promise<any> {
        return await this.prisma.codeRedemption.create({
            data: {
                user_id: userId,
                code_id: codeId,
            },
        })
    }

    async updateWalletBalance(
        userId: string,
        newBalance: number
    ): Promise<any | null> {
        return await this.prisma.wallet.update({
            where: { user_id: userId },
            data: {
                coin_balance: newBalance,
                updated_at: new Date(),
            },
        })
    }

    async getWalletByUserId(userId: string): Promise<any | null> {
        return await this.prisma.wallet.findUnique({
            where: { user_id: userId },
        })
    }

    async createTransaction(data: {
        recipientUserId: string
        type: string
        coinAmount: number
        relatedCodeId: number
    }): Promise<any> {
        return await this.prisma.transaction.create({
            data: {
                recipient_user_id: data.recipientUserId,
                type: data.type,
                coin_amount: data.coinAmount,
                related_code_id: data.relatedCodeId,
            },
        })
    }

    async getUserWithRole(userId: string): Promise<any | null> {
        return await this.prisma.user.findUnique({
            where: { id: userId },
        })
    }

    async executeTransaction<T>(
        callback: (prisma: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return await this.prisma.$transaction(callback)
    }
}
