import { MockRepository } from "@/repository/mock/mockRepository"

export class MockUsecase {
    private mockRepository: MockRepository

    constructor(mockRepository: MockRepository) {
        this.mockRepository = mockRepository
    }

    async pingDB(): Promise<void> {
        await this.mockRepository.pingDB()
    }
}
