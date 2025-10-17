class Reference_Mapper {
  private map = new Map<
    string,
    {
      captured: string | string[];
      isSequence: boolean;
      capturedAt: "condition" | "exception";
    }
  >();
  constructor() {
    this.map = new Map();
  }

  capture_reference(
    name: string,
    captured: string | string[],
    isSequence: boolean,
    capturedAt: "condition" | "exception"
  ) {
    this.map.set(name, { captured, isSequence, capturedAt });
  }
}

export default Reference_Mapper;
