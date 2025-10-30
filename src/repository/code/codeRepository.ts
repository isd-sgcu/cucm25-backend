import { prisma } from "@/lib/prisma"
import { Code, CodeRedemption, Transaction, Wallet, User } from "@prisma/client"

export interface ICodeRepository {
    generateUniqueCodeString(): Promise<string>

    createCode(data: {
        codeString: string
        targetRole: string
        activityName: string
        rewardCoin: number
        createdByUserId: string
        expiresAt: Date
    }): Promise<Code>

    findCodeByString(codeString: string): Promise<Code | null>

    findCodeWithCreator(codeString: string): Promise<
        | (Code & {
              creator: User
          })
        | null
    >

    checkIfUserRedeemedCode(userId: string, codeId: number): Promise<boolean>

    createRedemption(userId: string, codeId: number): Promise<CodeRedemption>

    updateWalletBalance(
        userId: string,
        newBalance: number
    ): Promise<Wallet | null>

    getWalletByUserId(userId: string): Promise<Wallet | null>

    createTransaction(data: {
        recipientUserId: string
        type: string
        coinAmount: number
        relatedCodeId: number
    }): Promise<Transaction>

    getUserWithRole(userId: string): Promise<
        | (User & {
              role: { name: string }
          })
        | null
    >
}

export class CodeRepository implements ICodeRepository {
    async generateUniqueCodeString(): Promise<string> {
        while (true) {
            // สุ่ม 1 ตัวอักษรพิมพ์ใหญ่ (A-Z)
            const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
            // สุ่ม 3 ตัวเลข (000-999)
            const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            
            const codeString = letter + numbers
            
            // เช็คว่าซ้ำไหม
            const existingCode = await this.findCodeByString(codeString)
            if (!existingCode) {
                return codeString
            }
        }
    }

    async createCode(data: {
        codeString: string
        targetRole: string
        activityName: string
        rewardCoin: number
        createdByUserId: string
        expiresAt: Date
    }): Promise<Code> {
        const createData: any = {
            code_string: data.codeString,
            target_role: data.targetRole,
            activity_name: data.activityName,
            reward_coin: data.rewardCoin,
            expires_at: data.expiresAt,
            created_by_user_id: data.createdByUserId,
        }
        
        return await prisma.code.create({
            data: createData,
        })
    }

    async findCodeByString(codeString: string): Promise<Code | null> {
        return await prisma.code.findUnique({
            where: { code_string: codeString },
        })
    }

    async findCodeWithCreator(
        codeString: string
    ): Promise<(Code & { creator: User }) | null> {
        return await prisma.code.findUnique({
            where: { code_string: codeString },
            include: { creator: true },
        })
    }

    async checkIfUserRedeemedCode(
        userId: string,
        codeId: number
    ): Promise<boolean> {
        const redemption = await prisma.codeRedemption.findUnique({
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
    ): Promise<CodeRedemption> {
        return await prisma.codeRedemption.create({
            data: {
                user_id: userId,
                code_id: codeId,
            },
        })
    }

    async updateWalletBalance(
        userId: string,
        newBalance: number
    ): Promise<Wallet | null> {
        return await prisma.wallet.update({
            where: { user_id: userId },
            data: {
                coin_balance: newBalance,
                updated_at: new Date(),
            },
        })
    }

    async getWalletByUserId(userId: string): Promise<Wallet | null> {
        return await prisma.wallet.findUnique({
            where: { user_id: userId },
        })
    }

    async createTransaction(data: {
        recipientUserId: string
        type: string
        coinAmount: number
        relatedCodeId: number
    }): Promise<Transaction> {
        return await prisma.transaction.create({
            data: {
                recipient_user_id: data.recipientUserId,
                type: data.type,
                coin_amount: data.coinAmount,
                related_code_id: data.relatedCodeId,
            },
        })
    }

    async getUserWithRole(userId: string): Promise<
        | (User & {
              role: { name: string }
          })
        | null
    > {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        })
    }
}
