import { EducationLevel } from "@prisma/client"

export const P_MAPPING: Record<string, EducationLevel> = {
    "1": EducationLevel.Y1,
    "2": EducationLevel.Y2,
    "3": EducationLevel.Y3,
    "4": EducationLevel.Y4,
    บัณฑิต: EducationLevel.GRADUATED,
}

export const N_MAPPING: Record<string, EducationLevel> = {
    "4": EducationLevel.M4,
    "5": EducationLevel.M5,
    "6": EducationLevel.M6,
}
