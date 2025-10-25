import { AppError } from "@/types/error/AppError"
import { NextFunction, Request, Response } from "express"

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
        })
        return
    }
    console.error("Error something:", err)
    res.status(500).json({
        message: "An unexpected error occurred",
    })
}
