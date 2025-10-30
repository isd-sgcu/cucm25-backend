import { ISystemUsecase } from "@/usecase/system/systemUsecase"
import { Request, Response } from "express"
import { AppError } from "@/types/error/AppError"

export class SystemController {
    constructor(private systemUsecase: ISystemUsecase) {}

    async toggleSystem(req: Request, res: Response): Promise<void> {
        try {
            // Check admin permission
            const adminUserId = req.headers["x-user-id"] || req.body.adminUserId
            
            if (!adminUserId || typeof adminUserId !== "string") {
                res.status(400).json({
                    error: "Admin user ID is required (x-user-id header or adminUserId in body)",
                })
                return
            }

            const { settingKey, enabled } = req.body

            // Validation
            if (!settingKey || enabled === undefined) {
                res.status(400).json({
                    error: "Missing required fields: settingKey, enabled",
                })
                return
            }

            if (typeof enabled !== "boolean") {
                res.status(400).json({
                    error: "Field 'enabled' must be a boolean",
                })
                return
            }

            const result = await this.systemUsecase.toggleSystemSetting(
                { settingKey, enabled },
                adminUserId
            )

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
                console.error("Toggle system error:", error)
                res.status(500).json({
                    error: "Internal server error",
                })
            }
        }
    }

    async getSystemStatus(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.systemUsecase.getSystemStatus()

            res.status(200).json({
                success: true,
                data: result,
            })
        } catch (error) {
            console.error("Get system status error:", error)
            res.status(500).json({
                error: "Internal server error",
            })
        }
    }
}