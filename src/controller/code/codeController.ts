import { ICodeUsecase } from "@/usecase/code/codeUsecase"
import { Request, Response } from "express"
import { AppError } from "@/types/error/AppError"

export class CodeController {
    constructor(private codeUsecase: ICodeUsecase) {}

    async generateCode(req: Request, res: Response): Promise<void> {
        try {
            // Get user ID from JWT token (set by authMiddleware)
            const creatorUserId = req.user?.id

            if (!creatorUserId) {
                res.status(401).json({
                    error: "Authentication required",
                })
                return
            }

            const { targetRole, activityName, rewardCoin, expiresAt } =
                req.body

            // Validation
            if (
                !targetRole ||
                !activityName ||
                rewardCoin === undefined ||
                !expiresAt
            ) {
                res.status(400).json({
                    error: "Missing required fields: targetRole, activityName, rewardCoin, expiresAt",
                })
                return
            }

            if (!["junior", "senior", "all"].includes(targetRole)) {
                res.status(400).json({
                    error: "targetRole must be one of: junior, senior, all",
                })
                return
            }

            const result = await this.codeUsecase.generateCode(
                {
                    targetRole,
                    activityName,
                    rewardCoin: Number(rewardCoin),
                    expiresAt,
                },
                creatorUserId
            )

            res.status(201).json({
                success: true,
                data: result,
            })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    error: error.message,
                })
            } else {
                console.error("Generate code error:", error)
                res.status(500).json({
                    error: "Internal server error",
                })
            }
        }
    }

    async redeemCode(req: Request, res: Response): Promise<void> {
        try {
            // Get user ID from JWT token (set by authMiddleware)
            const userId = req.user?.id

            if (!userId) {
                res.status(401).json({
                    error: "Authentication required",
                })
                return
            }

            const { codeString } = req.body

            if (!codeString) {
                res.status(400).json({
                    error: "codeString is required",
                })
                return
            }

            const result = await this.codeUsecase.redeemCode(codeString, userId)

            res.status(200).json({
                success: true,
                data: result,
            })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    error: error.message,
                })
            } else {
                console.error("Redeem code error:", error)
                res.status(500).json({
                    error: "Internal server error",
                })
            }
        }
    }
}
