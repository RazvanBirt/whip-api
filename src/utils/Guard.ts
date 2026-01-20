type GuardResult = { succeeded: boolean; argumentName?: string };

export class Guard {
    static againstNullOrUndefined(value: any, name: string): GuardResult {
        if (value === null || value === undefined) {
            return { succeeded: false, argumentName: name };
        }
        return { succeeded: true };
    }

    static againstNullOrUndefinedBulk(args: { argument: any; argumentName: string }[]): GuardResult {
        for (const arg of args) {
            const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
            if (!result.succeeded) return result;
        }
        return { succeeded: true };
    }
}
