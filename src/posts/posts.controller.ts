import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './post.dto';
import { Post as PostEntity } from './post.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query('published', ParseBoolPipe) published?: boolean): PostEntity[] {
    return this.postsService.findAll(published);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): PostEntity {
    return this.postsService.findOne(id);
  }

  @Get('author/:authorId')
  findByAuthor(@Param('authorId', ParseIntPipe) authorId: number): PostEntity[] {
    return this.postsService.findByAuthor(authorId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPostDto: CreatePostDto): PostEntity {
    return this.postsService.create(createPostDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): PostEntity {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.postsService.remove(id);
  }
}
