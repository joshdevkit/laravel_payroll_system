export function minutesFromTime(value: string): number {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
}

export function isOvernightSchedule(startTime: string, endTime: string): boolean {
    return Boolean(
        startTime &&
            endTime &&
            minutesFromTime(endTime) <= minutesFromTime(startTime),
    );
}

export function resolveScheduleDuration(
    startTime: string,
    endTime: string,
    breakMinutes = 0,
): number {
    if (!startTime || !endTime || startTime === endTime) {
        return 0;
    }

    let end = minutesFromTime(endTime);
    const start = minutesFromTime(startTime);

    if (end <= start) {
        end += 24 * 60;
    }

    return Math.max(0, end - start - Math.max(0, breakMinutes));
}

export function formatScheduleDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

export function todayInManila(): string {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Manila',
    });
}

export function dateFromKey(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function dateKey(value: Date): string {
    return [
        value.getFullYear(),
        String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0'),
    ].join('-');
}

export function addDays(value: string, amount: number): string {
    const date = dateFromKey(value);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
}

export function monthStart(value: string): string {
    const date = dateFromKey(value);
    date.setDate(1);
    return dateKey(date);
}

export function formatMonth(value: string): string {
    return dateFromKey(value).toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });
}

export function formatDate(value: string): string {
    return dateFromKey(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatTime(value: string): string {
    const [hour, minute] = value.slice(0, 5).split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    });
}
