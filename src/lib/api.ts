import { KeycloakTokenResponse, LoginRequest } from "@/types/auth/POST"
import { ApiError } from "@/types/error/ApiError"
import { AppError } from "@/types/error/AppError"

const KEYCLOAK_API_BASE_URL =
    process.env.KEYCLOAK_API_BASE_URL || "localhost:3000/realms/cucm25"

interface ApiResponseRaw {
    message?: string
    error?: string
}

export async function getKeycloakToken(body: LoginRequest): Promise<string> {
    const url = `${KEYCLOAK_API_BASE_URL}/protocol/openid-connect/token`

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                username: body.username,
                password: body.password,
                grant_type: "password",
                scope: "openid profile email",
            }),
        })
        if (!response.ok) {
            let errorMsg = "Request failed"
            if (response.body) {
                try {
                    const responseText = await response.text()
                    const raw: ApiResponseRaw = JSON.parse(responseText)
                    errorMsg = raw.error || raw.message || errorMsg
                } catch {
                    errorMsg = "Request failed"
                }
            }
            throw new ApiError(errorMsg, response.status)
        }

        const data: KeycloakTokenResponse = await response.json()
        return data.access_token
    } catch (error) {
        if (error instanceof ApiError) {
            throw new AppError(error.message, error.status || 500)
        }
        console.error("Get Keycloak token error:", error)
        throw new AppError(
            error instanceof Error ? error.message : "Unknown error",
            500
        )
    }
}
