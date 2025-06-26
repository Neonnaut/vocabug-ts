class Logger {
    public errors: string[];
    public warnings: string[];
    public infos: string[];

    constructor() {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
    }

    error(error: string): void {
        this.errors.push(`${error}.`);
        console.error(error);
    }

    warn(warn: string): void {
        this.warnings.push(`Warning: ${warn}.`);
        console.warn(warn);
    }

    info(info: string): void {
        this.infos.push(`Info: ${info}.`);
        console.info(info);
    }

    silent_info(info: string): void {
        console.info(info);
    }
}

export default Logger;