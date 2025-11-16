import { ICodeRepository } from "@/repository/code/codeRepository"
import { AppError } from "@/types/error/AppError"
import {
    GenerateCodeRequest,
    GenerateCodeResponse,
    RedeemCodeResponse,
} from "@/types/code"

export interface ICodeUsecase {
    generateCode(
        data: GenerateCodeRequest,
        creatorUserId: string
    ): Promise<GenerateCodeResponse>
    redeemCode(
        codeString: string,
        userId: string
    ): Promise<RedeemCodeResponse>
}

export class CodeUsecase implements ICodeUsecase {
    constructor(private codeRepository: ICodeRepository) {}

    async generateCode(
        data: GenerateCodeRequest,
        creatorUserId: string
    ): Promise<GenerateCodeResponse> {
        // Generate unique code string automatically
        const codeString = await this.codeRepository.generateUniqueCodeString()

        const creator = await this.codeRepository.getUserWithRole(
            creatorUserId
        )
        if (!creator) {
            throw new AppError("User not found", 404)
        }

        const creatorRole = creator.role
        if (
            creatorRole !== "MODERATOR" &&
            creatorRole !== "ADMIN"
        ) {
            throw new AppError(
                "Only moderators and admins can generate codes",
                403
            )
        }

        if (
            creatorRole === "MODERATOR" &&
            data.targetRole !== "junior"
        ) {
            throw new AppError(
                "Moderators can only create junior-only codes",
                403
            )
        }

        if (data.rewardCoin < 0) {
            throw new AppError("Reward coin must be non-negative", 400)
        }

        // Parse และ validate expiration date (required)
        const expiresAt = new Date(data.expiresAt)
        if (isNaN(expiresAt.getTime())) {
            throw new AppError("Invalid expiration date format", 400)
        }
        if (expiresAt <= new Date()) {
            throw new AppError("Expiration date must be in the future", 400)
        }

        const code = await this.codeRepository.createCode({
            codeString: codeString,
            targetRole: data.targetRole,
            activityName: data.activityName,
            rewardCoin: data.rewardCoin,
            createdByUserId: creatorUserId,
            expiresAt: expiresAt,
        })

        return {
            id: code.id,
            codeString: code.code_string,
            targetRole: code.target_role,
            activityName: code.activity_name,
            rewardCoin: code.reward_coin,
            createdByUserId: code.created_by_user_id,
            expiresAt: code.expires_at ? code.expires_at.toISOString() : new Date().toISOString(),
            createdAt: code.created_at ? code.created_at.toISOString() : new Date().toISOString(),
        }
    }

    async redeemCode(
        codeString: string,
        userId: string
    ): Promise<RedeemCodeResponse> {
        const code = await this.codeRepository.findCodeByString(codeString)
        if (!code) {
            throw new AppError("Code not found", 404)
        }

        if (code.expires_at && code.expires_at < new Date()) {
            throw new AppError("Code has expired", 400)
        }

        const alreadyRedeemed =
            await this.codeRepository.checkIfUserRedeemedCode(userId, code.id)
        if (alreadyRedeemed) {
            throw new AppError("You have already redeemed this code", 400)
        }

        const user = await this.codeRepository.getUserWithRole(userId)
        if (!user) {
            throw new AppError("User not found", 404)
        }

        const userRole = user.role
        
        // Map RoleType enum to target role strings
        const roleMapping: Record<string, string> = {
            "PARTICIPANT": "junior",
            "STAFF": "senior", 
            "MODERATOR": "senior",
            "ADMIN": "senior"
        }
        
        const mappedUserRole = roleMapping[userRole] || "junior"
        
        if (code.target_role !== "all" && code.target_role !== mappedUserRole) {
            throw new AppError(
                `This code is only for ${code.target_role} role`,
                403
            )
        }

        const wallet = await this.codeRepository.getWalletByUserId(userId)
        if (!wallet) {
            throw new AppError("Wallet not found", 404)
        }

        const newBalance = wallet.coin_balance + code.reward_coin

        await this.codeRepository.createRedemption(userId, code.id)

        await this.codeRepository.updateWalletBalance(userId, newBalance)

        const transaction = await this.codeRepository.createTransaction({
            recipientUserId: userId,
            type: "CODE_REDEMPTION",
            coinAmount: code.reward_coin,
            relatedCodeId: code.id,
        })

        return {
            success: true,
            message: `Successfully redeemed code: ${code.activity_name}`,
            rewardCoin: code.reward_coin,
            newBalance,
            transactionId: transaction.id,
        }
    }
}
