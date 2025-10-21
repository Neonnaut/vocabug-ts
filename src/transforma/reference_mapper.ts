import { get_last } from "../utils/utilities";

class Reference_Mapper {
  private map = new Map<string, string[]>();

  public capture_stream_index: number|null = null;

  public capture_stream = [];
  public is_capturing_sequence = false;

  constructor() {
    this.map = new Map();
  }

  reset_capture_stream_index() {
    // Called at the end of each field, or 
    this.capture_stream_index = null;
  }
  set_capture_stream_index( index: number ) {
    this.capture_stream_index = index;
  }

  capture_reference( key: string, stream: string[] ) {
    if (this.capture_stream_index === null) {
      // There was no 'start reference capture', so we will get the last grapheme from the stream
      const last_item = get_last(stream);
      if (last_item) {
        this.map.set(key, [last_item]);
      } else {
        this.map.set(key, ['']);
      }
    } else {
      // Capture from the specified index to the end of the stream
      const captured_sequence = stream.slice(this.capture_stream_index);
      this.map.set(key, captured_sequence);
    }
  }

  get_captured_reference( key: string ): string[] {
    // Return the value of the reference, if none found, return key itself
    return this.map.get(key) ?? [key];
  }

  clone(): Reference_Mapper {
    const clone = new Reference_Mapper();
    clone.map = new Map(this.map);
    clone.capture_stream_index = this.capture_stream_index;
    return clone;
  }

  absorb(other: Reference_Mapper) {
    for (const [key, value] of other.map.entries()) {
      this.map.set(key, value);
    }
  }

}

export default Reference_Mapper;
