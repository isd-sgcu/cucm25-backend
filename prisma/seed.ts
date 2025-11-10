import { prisma } from "../src/lib/prisma"
import { RoleType } from "@prisma/client"

async function zeedQuestions(
    questions: Array<{
        id: number
        title: string
        role: RoleType
        options: Array<string>
    }>
) {
    for (const q of questions) {
        await prisma.question.create({
            data: {
                id: q.id,
                title: q.title,
                role: q.role,
                options: {
                    create: q.options.map((text) => ({ option_text: text })),
                },
            },
        })
    }
}

async function main() {
    const staffQuestions = [
        {
            id: 1,
            title: "What is your primary focus when reviewing user submissions?",
            role: RoleType.STAFF,
            options: [
                "Data integrity",
                "Policy compliance",
                "Content relevance",
                "User feedback",
            ],
        },
        {
            id: 2,
            title: "Which part of the system do you spend the most time supporting?",
            role: RoleType.STAFF,
            options: [
                "User Dashboard",
                "Admin Tools",
                "Quiz Engine",
                "Database Operations",
            ],
        },
        {
            id: 3,
            title: "How familiar are you with our current data reporting tools?",
            role: RoleType.STAFF,
            options: ["Not at all", "Basic usage", "Proficient", "Expert"],
        },
        {
            id: 4,
            title: "What is your preferred method for receiving internal communications?",
            role: RoleType.STAFF,
            options: [
                "Email",
                "Instant messaging (e.g., Slack)",
                "Video calls",
                "Internal forum",
            ],
        },
        {
            id: 5,
            title: "What access level do you typically require for your daily tasks?",
            role: RoleType.STAFF,
            options: [
                "Read-Only",
                "Standard Write",
                "Moderator",
                "Administrator",
            ],
        },
        {
            id: 6,
            title: "What is the most critical feature you believe the platform needs?",
            role: RoleType.STAFF,
            options: [
                "Enhanced analytics",
                "Better search",
                "Automated moderation",
                "Faster deployment",
            ],
        },
    ]
    const participantQuestions = [
        {
            id: 7,
            title: "Which year are you currently studying in?",
            role: RoleType.PARTICIPANT,
            options: ["Year 1", "Year 2", "Year 3", "Graduated", "Other"],
        },
        {
            id: 8,
            title: "What is your primary motivation for joining this platform?",
            role: RoleType.PARTICIPANT,
            options: [
                "Skill development",
                "Career preparation",
                "Academic requirement",
                "Networking",
            ],
        },
        {
            id: 9,
            title: "How much time do you plan to spend on the platform each week?",
            role: RoleType.PARTICIPANT,
            options: ["1-3 hours", "4-6 hours", "7-10 hours", "10+ hours"],
        },
        {
            id: 10,
            title: "What type of content do you find most engaging?",
            role: RoleType.PARTICIPANT,
            options: [
                "Interactive quizzes",
                "Video tutorials",
                "Detailed articles",
                "Community forums",
            ],
        },
        {
            id: 11,
            title: "What is the biggest challenge you face in your current studies?",
            role: RoleType.PARTICIPANT,
            options: [
                "Time management",
                "Lack of motivation",
                "Difficulty with specific subjects",
                "Finding resources",
            ],
        },
        {
            id: 12,
            title: "Which device do you use most often to access online learning tools?",
            role: RoleType.PARTICIPANT,
            options: ["Laptop/Desktop", "Smartphone", "Tablet", "Mixed usage"],
        },
    ]

    console.log(`🚀 Zeeding participantQuestions`)
    await zeedQuestions(participantQuestions)

    console.log(`🚀 Zeeding staffQuestions`)
    await zeedQuestions(staffQuestions)
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
