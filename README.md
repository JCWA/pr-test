# PR Test Project

NestJS 프로젝트에 AI 자동 테스트 생성 기능이 적용된 데모 프로젝트입니다.

## 🚀 Features

- **Users API**: 사용자 CRUD 작업
- **Posts API**: 게시글 CRUD 작업  
- **AI Auto Test Generation**: PR 생성 시 자동으로 테스트 코드 생성
- **Auto Testing**: 생성된 테스트 자동 실행

## 📋 API Endpoints

### Users
- `GET /users` - 모든 사용자 조회
- `GET /users/:id` - 특정 사용자 조회
- `POST /users` - 사용자 생성
- `PUT /users/:id` - 사용자 수정
- `DELETE /users/:id` - 사용자 삭제

### Posts
- `GET /posts` - 모든 게시글 조회
- `GET /posts?published=true` - 발행된 게시글만 조회
- `GET /posts/:id` - 특정 게시글 조회
- `GET /posts/author/:authorId` - 특정 작성자의 게시글 조회
- `POST /posts` - 게시글 생성
- `PUT /posts/:id` - 게시글 수정
- `DELETE /posts/:id` - 게시글 삭제

## 🛠️ Installation

```bash
# 의존성 설치
yarn install
```

## 🏃 Running the app

```bash
# development
yarn start:dev

# production
yarn start:prod
```

## 🧪 Testing

```bash
# unit tests
yarn test

# e2e tests
yarn test:e2e

# test coverage
yarn test:cov

# AI 테스트 생성 (로컬)
yarn ai:generate-tests
```

## 🤖 AI Auto Test System

### GitHub Actions Workflow

PR을 생성하면 자동으로:
1. ✅ Lint & Build 체크
2. 🤖 변경된 파일에 대한 테스트 코드 AI 생성
3. 🧪 생성된 테스트 자동 실행
4. 📊 커버리지 리포트 생성
5. 💬 PR에 결과 코멘트 추가

### Setup

#### 1. Anthropic API Key 발급
- https://console.anthropic.com 에서 API Key 생성

#### 2. GitHub Repository Secrets 추가
- Repository Settings → Secrets → Actions
- `ANTHROPIC_API_KEY` 추가

#### 3. PR 생성
```bash
# 새 기능 브랜치 생성
git checkout -b feature/new-api

# 코드 작성
# src/users/users.service.ts 수정...

# 커밋 & 푸시
git add .
git commit -m "feat: Add new user feature"
git push origin feature/new-api

# PR 생성 → GitHub Actions 자동 실행!
```

### Local Test Generation

```bash
# 환경 변수 설정
export ANTHROPIC_API_KEY="your-key-here"

# 테스트 생성
yarn ai:generate-tests
```

## 📊 Project Structure

```
pr-test/
├── src/
│   ├── users/              # Users API
│   │   ├── user.entity.ts
│   │   ├── user.dto.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   ├── posts/              # Posts API
│   │   ├── post.entity.ts
│   │   ├── post.dto.ts
│   │   ├── posts.service.ts
│   │   ├── posts.controller.ts
│   │   └── posts.module.ts
│   └── main.ts
├── scripts/
│   └── generate-tests.js   # AI 테스트 생성 스크립트
├── .github/
│   └── workflows/
│       └── pr-auto-test.yml
└── test/
    └── app.e2e-spec.ts
```

## 💡 Example Usage

### Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "age": 25
  }'
```

### Create Post
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "Hello World!",
    "authorId": 1,
    "published": true
  }'
```

## 📝 License

UNLICENSED
