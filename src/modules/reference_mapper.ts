class Reference_Mapper {
    private store = new Map<'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9', {
      captured: string | string[];
      isSequence: boolean;
      capturedAt: 'condition' | 'exception';
    }>();

    constructor() {
        this.store = new Map;
    }

    restore_escaped_chars(input: string): string {
      return input;
    }
}

export default Reference_Mapper;