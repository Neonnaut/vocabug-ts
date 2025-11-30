
class Associateme_Mapper {
  private map = new Map<string, string[]>();

  constructor() {
    this.map = new Map();
  }

  set_associateme_class(base:string, associatemes:string[]) {
    this.map.set(base, associatemes);
  }

  // check if the input matches any associateme of the to-match base-grapheme
  match_associateme(base:string, input:string): boolean {
    return true
  }

}

export default Associateme_Mapper;
