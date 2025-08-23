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

    Uncaught_Error = class Uncaught_Error extends Error {
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
        const err = new this.Uncaught_Error(original);
        const location = this.extract_location(err.stack);
        const log_message = `${err.name}: ${err.message}${location ? " @ " + location : ""}`;
        this.errors.push(log_message);
    }

    Validation_Error = class Validation_Error extends Error {
        constructor(message: string) {
            super(message);
            this.name = "Validation_Error";
            Object.setPrototypeOf(this, new.target.prototype);
        }
    };
    validation_error(message: string, line_num: number|null = null): never {
        const err = new this.Validation_Error(message);
        if (line_num || line_num === 0) {
            this.errors.push(`Error: ${message} @ line ${line_num+1}.`);
        } else {
            this.errors.push(`Error: ${message}.`);
        }
        throw err;
    }

    private extract_location(stack?: string): string | null {
        if (!stack) return null;

        const lines = stack.split("\n");
        for (const line of lines) {
            const match = line.match(/(?:\(|\bat\s+)?(.*?):(\d+):(\d+)\)?/);
            if (match) {
                let file_path = match[1].replace(/\?.*$/, ""); // Strip ?t=... junk
                file_path = file_path.replace(/^.*\/src\//, "modules/"); // Map root
                file_path = file_path.replace(/(\bmodules\b\/)\1/, "$1"); // Fix repetition

                return `${file_path}:${match[2]}`;
            }
        }

        return null; // Nothing matched
    }

    warn(warn: string, line_num: number|null = null): void {
        if (line_num || line_num === 0) {
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