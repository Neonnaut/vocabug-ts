class Logger {
    public errors: string[];
    public warnings: string[];
    public infos: string[];
    public diagnostics: string[];

    constructor() {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
        this.diagnostics = [];
    }

    UncaughtError = class UncaughtError extends Error {
        constructor(original: Error) {
            super(original.message); // Preserve original message
            this.name = original.name || "Error";
            Object.setPrototypeOf(this, new.target.prototype);

            if (original.stack) {
                this.stack = original.stack; // Preserve original stack
            }
        }
    };

    uncaught_error(original: Error) {
        const err = new this.UncaughtError(original);
        const location = this.extractLocation(err.stack);
        const logMessage = `${err.name}: ${err.message}${location ? " @ " + location : ""}`;
        this.errors.push(logMessage);
    }

    ValidationError = class ValidationError extends Error {
        constructor(message: string) {
            super(message);
            this.name = "ValidationError";
            Object.setPrototypeOf(this, new.target.prototype);
        }
    };
    validation_error(message: string, line_num: number|null = null): never {
        const err = new this.ValidationError(message);
        if (line_num || line_num == 0) {
            this.errors.push(`Error: ${message} @ line ${line_num+1}.`);
        } else {
            this.errors.push(`Error: ${message}.`);
        }
        throw err;
    }

    private extractLocation(stack?: string): string | null {
        const line = stack?.split("\n")[1];
        if (!line) return null;

        const match = line.match(/(?:\(|\bat\s+)?(.*?):(\d+):(\d+)\)?/);
        if (!match) return null;

        let filePath = match[1].replace(/\?.*$/, ""); // Strip ?t=... junk
        filePath = filePath.replace(/^.*\/src\//, "modules/"); // Map root
        filePath = filePath.replace(/(\bmodules\b\/)\1/, "$1"); // Fix repetition

        return `${filePath}:${match[2]}`;
    }

    warn(warn: string, line_num: number|null = null): void {
        if (line_num) {
            this.warnings.push(`Warning: ${warn} @ line ${line_num+1}.`);
        } else {
            this.warnings.push(`Warning: ${warn}.`);
        }
        
    }

    info(info: string): void {
        this.infos.push(`Info: ${info}.`);
    }
    diagnostic(diagnostic: string): void {
        this.diagnostics.push(diagnostic);
    }
}

export default Logger;