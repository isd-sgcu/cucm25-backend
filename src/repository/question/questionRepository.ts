import { prisma } from "@/lib/prisma"
import { RoleType } from "@prisma/client"

export class QuestionRepository {
    async getAllQuestionsId(role: RoleType): Promise<Array<number>> {
        const questions = await prisma.question.findMany({
            where: {
                role: role,
            },
            select: {
                id: true,
            },
        })

        return questions.map((question) => question.id)
    }

    /* 
    Batch
    
    async getQuestionOptionIds(
        lookups: Array<{ questionId: number; optionText: string }>
    ): Promise<Array<{ id: number; questionId: number; optionText: string }>> {
        const questionOptions = await prisma.questionOption.findMany({
            where: {
                OR: lookups.map((l) => ({
                    question_id: l.questionId,
                    option_text: l.optionText,
                })),
            },
            select: {
                id: true,
                question_id: true,
                option_text: true,
            },
        })

        return questionOptions.map((questionOption) => ({
            id: questionOption.id,
            questionId: questionOption.question_id,
            optionText: questionOption.option_text,
        }))
    }
    */

    async getQuestionOptionId(
        id: number,
        optionText: string
    ): Promise<number | null> {
        const questionOption = await prisma.questionOption.findFirst({
            where: {
                AND: [{ question_id: id }, { option_text: optionText }],
            },
        })
        if (!questionOption) {
            return null
        }
        return questionOption.id
    }
}
