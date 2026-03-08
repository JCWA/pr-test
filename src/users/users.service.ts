import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private currentId = 1;

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  create(createUserDto: CreateUserDto): User {
    const user = new User({
      id: this.currentId++,
      ...createUserDto,
    });
    this.users.push(user);
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto): User {
    const user = this.findOne(id);
    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();
    return user;
  }

  remove(id: number): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    this.users.splice(index, 1);
  }
}
// Test AI auto generation
