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

    error(error: string): void {
        this.errors.push(`Error: ${error}.`);
    }

    warn(warn: string): void {
        this.warnings.push(`Warning: ${warn}.`);
    }

    info(info: string): void {
        this.infos.push(`Info: ${info}.`);
    }
    diagnostic(diagnostic: string): void {
        this.diagnostics.push(diagnostic);
    }
}

export default Logger;