/**
 * Simple logger utility with different log levels
 * Hides sensitive information in production
 */

enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

const isProduction = process.env.NODE_ENV === "production"

function formatLog(level: LogLevel, context: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const levelStr = `[${level}]`
    const contextStr = `[${context}]`
    
    let logMessage = `${timestamp} ${levelStr} ${contextStr} ${message}`
    
    if (data) {
        // In production, avoid logging sensitive data
        if (isProduction && (message.includes("role") || message.includes("user") || message.includes("id"))) {
            logMessage += " (data hidden in production)"
        } else {
            logMessage += ` ${JSON.stringify(data)}`
        }
    }
    
    return logMessage
}

export const logger = {
    debug(context: string, message: string, data?: any) {
        // Only log debug in development
        if (!isProduction) {
            const log = formatLog(LogLevel.DEBUG, context, message, data)
            console.log(log)
        }
    },
    
    info(context: string, message: string, data?: any) {
        const log = formatLog(LogLevel.INFO, context, message, data)
        console.log(log)
    },
    
    warn(context: string, message: string, data?: any) {
        const log = formatLog(LogLevel.WARN, context, message, data)
        console.warn(log)
    },
    
    error(context: string, message: string, error?: any) {
        const log = formatLog(LogLevel.ERROR, context, message)
        console.error(log)
        if (error && !isProduction) {
            console.error(error)
        }
    },
}
