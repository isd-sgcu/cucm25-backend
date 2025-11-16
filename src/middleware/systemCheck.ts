import { Request, Response, NextFunction } from "express"
import { SystemRepository } from "@/repository/system/systemRepository"
import { SystemUsecase } from "@/usecase/system/systemUsecase"
import { verifyJwt } from "@/utils/jwt"
import { logger } from "@/utils/logger"
import { prisma } from "@/lib/prisma"

const systemRepository = new SystemRepository(prisma)
const systemUsecase = new SystemUsecase(systemRepository)

export async function checkSystemAvailability(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        // Skip check for system endpoints themselves and auth endpoints
        if (req.path.startsWith('/system/') || req.path.startsWith('/auth/')) {
            next()
            return
        }

        let userRole: string | undefined

        // Try to get user from JWT token (if authenticated)
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1]
            if (token) {
                try {
                    const decoded = verifyJwt(token)
                    const user = await systemRepository.getUserWithRole(decoded.id)
                    if (user) {
                        // Map RoleType enum to string for system check
                        const roleMapping: Record<string, string> = {
                            "PARTICIPANT": "junior",
                            "STAFF": "senior", 
                            "MODERATOR": "moderator",
                            "ADMIN": "senior"
                        }
                        userRole = roleMapping[user.role] || "junior"
                        logger.debug("SystemCheck", "User role mapped", { 
                            originalRole: user.role, 
                            mappedRole: userRole 
                        })
                    }
                } catch (jwtError) {
                    // Invalid token, continue without user role
                    logger.debug("SystemCheck", "JWT verification failed", { error: String(jwtError) })
                }
            }
        }
        
        // Check system availability based on user role
        const isAvailable = await systemUsecase.checkSystemAvailability(userRole)
        
        logger.debug("SystemCheck", "Availability check result", { userRole, isAvailable })
        
        if (!isAvailable) {
            let roleMessage: string
            if (userRole === "junior") {
                roleMessage = "น้องค่าย"
            } else if (userRole === "moderator") {
                roleMessage = "ผู้ดำเนินการ"
            } else if (userRole === "senior") {
                roleMessage = "พี่ค่าย"
            } else if (userRole) {
                roleMessage = `ผู้ใช้ประเภท (${userRole})`
            } else {
                roleMessage = "ผู้ใช้ที่ไม่ทราบประเภท"
            }
            
            logger.warn("SystemCheck", "System access blocked for role", { userRole })
            res.status(503).json({
                error: `ระบบสำหรับ${roleMessage}ปิดการใช้งานชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง`,
                systemStatus: "disabled",
                userRole: userRole || "unknown"
            })
            return
        }
        next()
    } catch (error) {
        logger.error("SystemCheck", "System availability check failed", error)
        // On error, allow the request to proceed (fail-open)
        next()
    }
}