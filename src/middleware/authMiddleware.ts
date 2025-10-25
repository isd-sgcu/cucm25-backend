import { jwtUser, verifyJwt } from "@/utils/jwt"
import { NextFunction, Request, Response } from "express"

declare module "express" {
    interface Request {
        user?: jwtUser
    }
}

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: Token not provided" })
        return
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
        res.status(401).json({ message: "Unauthorized: Token not provided" })
        return
    }

    try {
        const decoded = verifyJwt(token)
        req.user = decoded
        next()
    } catch (error) {
        console.log("JWT verification error: ", error)
        res.status(401).json({ message: "Unauthorized: Invalid token" })
    }
}
