import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  create(createUserDto: CreateUserDto): User {
    // Check if email already exists
    const existingUser = this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException(`User with email ${createUserDto.email} already exists`);
    }

    const user = new User({
      id: this.currentId++,
      ...createUserDto,
    });
    this.users.push(user);
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto): User {
    const user = this.findOne(id);
    
    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new BadRequestException(`User with email ${updateUserDto.email} already exists`);
      }
    }
    
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

  // Get user statistics
  getStats() {
    return {
      total: this.users.length,
      avgAge: this.users.length > 0 
        ? this.users.reduce((sum, u) => sum + (u.age || 0), 0) / this.users.length 
        : 0,
    };
  }
}
