import "dotenv/config"
import express, { Request, Response } from "express"
import cors from "cors"
import bodyParser from "body-parser"
import routerManager from "@/router"
import { errorHandler } from "@/middleware/errorHandler"
import { checkSystemAvailability } from "@/middleware/systemCheck"

const app = express()
const PORT = 8080

app.use(cors())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
})

// System availability check middleware (applies to all /api routes)
app.use("/api", checkSystemAvailability)

app.use("/api", routerManager())

app.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "healthy",
        timeStamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})
