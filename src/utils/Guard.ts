type GuardResult = { succeeded: boolean; argumentName?: string };

export class Guard {
    static againstNullOrUndefined(value: unknown, name: string): GuardResult {
        if (value === null || value === undefined) {
            return { succeeded: false, argumentName: name };
        }
        return { succeeded: true };
    }

    static againstNullOrUndefinedBulk(args: { argument: unknown; argumentName: string }[]): GuardResult {
        for (const arg of args) {
            const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
            if (!result.succeeded) return result;
        }
        return { succeeded: true };
    }

    static againstNullOrWhiteSpace(value: unknown, name: string): GuardResult {
        if (value === null || value === undefined) return { succeeded: false, argumentName: name };
        if (typeof value === "string" && value.trim().length === 0) return { succeeded: false, argumentName: name };
        return { succeeded: true };
    }
}
