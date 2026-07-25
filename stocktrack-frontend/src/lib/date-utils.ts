export function toLocalISOString(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error("Invalid Date object")
    }

    return date.toISOString().slice(0, 19)
}

export function isValidLocalISOString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
}

export function assertValidDateRange(start: string, end: string): void {
    if (!isValidLocalISOString(start) || !isValidLocalISOString(end)) {
        throw new Error("Dates must be ISO-8601 format: yyyy-MM-ddTHH:mm:ss")
    }

    if (new Date(start) > new Date(end)) {
        throw new Error("Start date must be before end date")
    }
}
