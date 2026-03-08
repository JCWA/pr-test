export class Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Post>) {
    Object.assign(this, partial);
    this.published = this.published ?? false;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }
}
