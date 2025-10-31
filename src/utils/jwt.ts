import type { AuthUser, KeycloakUser } from "@/types/auth"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "JWTSECRET"
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\n${process.env.KEYCLOAK_PUBLIC_KEY}\n-----END PUBLIC KEY-----`
const EXPIRES_IN = "3d"

export function signJwt(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyJwt(token: string): AuthUser {
    return jwt.verify(token, JWT_SECRET) as AuthUser
}

export function verifyKeycloakJwt(token: string): KeycloakUser {
    return jwt.verify(token, PUBLIC_KEY) as KeycloakUser
}
