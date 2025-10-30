import { Request, Response, NextFunction } from "express"
import { SystemRepository } from "@/repository/system/systemRepository"
import { SystemUsecase } from "@/usecase/system/systemUsecase"
import { prisma } from "@/lib/prisma"

const systemRepository = new SystemRepository(prisma)
const systemUsecase = new SystemUsecase(systemRepository)

export async function checkSystemAvailability(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        // Skip check for system endpoints themselves  
        if (req.path.startsWith('/system/')) {
            next()
            return
        }

        // Get user ID from request headers
        const userId = req.headers["x-user-id"] as string | undefined
        
        let userRole: string | undefined
        
        // If we have user ID, get their actual role from database
        if (userId) {
            const user = await systemRepository.getUserWithRole(userId)
            userRole = user?.role?.name
        }

        // Check system availability based on user role
        const isAvailable = await systemUsecase.checkSystemAvailability(userRole)
        
        if (!isAvailable) {
            res.status(503).json({
                error: "System is currently unavailable. Please try again later.",
                systemStatus: "disabled"
            })
            return
        }
        next()
    } catch (error) {
        console.error("System availability check error:", error)
        // On error, allow the request to proceed (fail-open)
        next()
    }
}