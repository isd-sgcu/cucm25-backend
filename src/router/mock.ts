import { MockController } from "@/controller/mock/mockController"
import { MockRepository } from "@/repository/mock/mockRepository"
import { MockUsecase } from "@/usecase/mock/mockUsecase"
import { Router } from "express"

export default function mockRouter() {
    const router = Router()
    const mockRepository = new MockRepository()
    const mockUsecase = new MockUsecase(mockRepository)
    const mockController = new MockController(mockUsecase)

    router.get("/", mockController.mockPing.bind(mockController))

    return router
}
