import { User } from "@prisma/client"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "JWTSECRET"
const EXPIRES_IN = "3d"

export type jwtUser = Pick<User, "id" | "username" | "role">

export interface KeycloakUser {
    sub: string
    groups: Array<string>
    studentId: string
    nickName: string
    name: string
    preferred_username: string
    given_name: string
    family_name: string
}

export function signJwt(user: jwtUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyJwt(token: string): jwtUser {
    return jwt.verify(token, JWT_SECRET) as jwtUser
}

export function decodeKeycloakJwt(token: string): KeycloakUser {
    return jwt.decode(token) as KeycloakUser
}
