export class PlayerInstance {
  id: string;
  name: string;  

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  getId() {
    return this.id;
  }
  setId(newId: string) {
    this.id = newId;
  }
  getName() {
    return this.name;
  }
  setName(newName: string) {
    this.name = newName;
  }
}