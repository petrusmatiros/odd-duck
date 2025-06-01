export class PlayerInstance {
  id: string;
  name: string | null = null;  

  constructor() {
    this.id = crypto.randomUUID();
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