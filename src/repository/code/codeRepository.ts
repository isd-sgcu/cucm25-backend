import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

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
}

export class CodeRepository implements ICodeRepository {
    constructor(private prisma: PrismaClient) {}

    async generateUniqueCodeString(): Promise<string> {
        const MAX_RETRIES = 100
        let attempts = 0

        while (attempts < MAX_RETRIES) {
            attempts++

            // สุ่ม 1 ตัวอักษรพิมพ์ใหญ่ (A-Z) = 26 combinations
            const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
            // สุ่ม 3 ตัวเลข (000-999) = 1,000 combinations
            const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            
            // รวม = 26 × 1,000 = 26,000 possible combinations
            const codeString = letter + numbers
            
            // เช็คว่าซ้ำไหม
            const existingCode = await this.findCodeByString(codeString)
            if (!existingCode) {
                return codeString
            }
            
            // Log warning เมื่อเริ่มมี collision บ่อย
            if (attempts > 50) {
                console.warn(`Code generation collision detected. Attempt ${attempts}/${MAX_RETRIES}. Format: ${letter + numbers}`)
            }
        }

        // หากพยายามครบแล้วยังไม่ได้ ให้ใช้ timestamp + random เพื่อความแน่นอน
        const timestamp = Date.now().toString().slice(-3) // เอา 3 หลักสุดท้าย
        const fallbackCode = `X${timestamp}` // X + 3 digit timestamp
        
        console.warn(`Code generation reached max retries. Using fallback: ${fallbackCode}`)
        
        // ตรวจสอบ fallback code ซ้ำไหม (โอกาสน้อยมาก)
        const existingFallback = await this.findCodeByString(fallbackCode)
        if (!existingFallback) {
            return fallbackCode
        }
        
        // หากยัง fallback ยังซ้ำ ให้ throw error
        throw new Error('Unable to generate unique code: system may be approaching capacity limit')
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
}
