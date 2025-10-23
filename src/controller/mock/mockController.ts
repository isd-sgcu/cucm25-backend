import { AppError } from "@/types/error/AppError"
import { MockUsecase } from "@/usecase/mock/mockUsecase"
import type { Request, Response } from "express"

export class MockController {
    private mockUsecase: MockUsecase

    constructor(mockUsecase: MockUsecase) {
        this.mockUsecase = mockUsecase
    }

    async mockPing(_req: Request, res: Response): Promise<void> {
        try {
            await this.mockUsecase.pingDB()
            res.status(200).json({ message: "Mock Rider!" })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
                return
            }
            console.error("Error something:", error)
            res.status(500).json({
                message: "An unexpected error occurred",
            })
        }
    }
}
