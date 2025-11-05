
class Associateme_Mapper {
  private map = new Map<string, string[]>();

  constructor() {
    this.map = new Map();
  }

  set_associateme_class(base:string, associatemes:string[]) {
    this.map.set(base, associatemes);
  }

}

export default Associateme_Mapper;
