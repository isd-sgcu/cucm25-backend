import { Request, Response, NextFunction } from "express"
import { SystemRepository } from "@/repository/system/systemRepository"
import { SystemUsecase } from "@/usecase/system/systemUsecase"
import { verifyJwt } from "@/utils/jwt"
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
                            "MODERATOR": "senior",
                            "ADMIN": "senior"
                        }
                        userRole = roleMapping[user.role] || "junior"
                        console.log(`[SystemCheck] User ${decoded.id} has role: ${user.role} -> mapped to: ${userRole}`)
                    }
                } catch (jwtError) {
                    // Invalid token, continue without user role
                    console.log("JWT verification failed in system check:", jwtError)
                }
            }
        }
        
        // Add debugging log
        console.log(`[SystemCheck] Path: ${req.path}, UserRole: ${userRole}`)

        // Check system availability based on user role
        const isAvailable = await systemUsecase.checkSystemAvailability(userRole)
        
        console.log(`[SystemCheck] Role: ${userRole}, Available: ${isAvailable}`)
        
        if (!isAvailable) {
            const roleMessage = userRole === "junior" ? "น้องค่าย" : "พี่ค่าย"
            console.log(`[SystemCheck] BLOCKING REQUEST - Role: ${userRole} is disabled`)
            res.status(503).json({
                error: `ระบบสำหรับ${roleMessage}ปิดการใช้งานชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง`,
                systemStatus: "disabled",
                userRole: userRole
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