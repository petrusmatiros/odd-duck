export class PlayerInstance {
  id: string;
  name: string | null;  

  constructor(name: string | null) {
    this.id = crypto.randomUUID();
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