import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from './post.entity';
import { CreatePostDto, UpdatePostDto } from './post.dto';

@Injectable()
export class PostsService {
  private posts: Post[] = [];
  private currentId = 1;

  findAll(published?: boolean): Post[] {
    if (published !== undefined) {
      return this.posts.filter((p) => p.published === published);
    }
    return this.posts;
  }

  findOne(id: number): Post {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  findByAuthor(authorId: number): Post[] {
    return this.posts.filter((p) => p.authorId === authorId);
  }

  create(createPostDto: CreatePostDto): Post {
    const post = new Post({
      id: this.currentId++,
      ...createPostDto,
    });
    this.posts.push(post);
    return post;
  }

  update(id: number, updatePostDto: UpdatePostDto): Post {
    const post = this.findOne(id);
    Object.assign(post, updatePostDto);
    post.updatedAt = new Date();
    return post;
  }

  remove(id: number): void {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    this.posts.splice(index, 1);
  }
}
