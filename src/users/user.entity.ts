export class User {
  id: number;
  email: string;
  name: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }
}
