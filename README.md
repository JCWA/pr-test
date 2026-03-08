# PR Test Project

NestJS 프로젝트에 **AI 자동 코드 리뷰 & 테스트 생성** 기능이 적용된 데모 프로젝트입니다.

## 🚀 Features

- **Users API**: 사용자 CRUD 작업 (이메일 중복 체크 포함)
- **Posts API**: 게시글 CRUD 작업  
- **🤖 AI Code Review**: PR 생성 시 자동 코드 리뷰 ([guide 문서](https://github.com/jcwa/guide) 기반)
- **🧪 AI Auto Test Generation**: 변경된 파일에 대한 테스트 자동 생성
- **✅ Auto Testing**: 생성된 테스트 자동 실행 + 커버리지 리포트

## 📋 API Endpoints

### Users
- `GET /users` - 모든 사용자 조회
- `GET /users/:id` - 특정 사용자 조회
- `POST /users` - 사용자 생성 (이메일 중복 체크)
- `PUT /users/:id` - 사용자 수정 (이메일 중복 체크)
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

## 🤖 AI Auto Review & Test System

### 자동 실행 프로세스

PR을 생성하면 자동으로:

```
1. 🔍 Lint & Build 체크
   ↓
2. 🤖 AI 코드 리뷰 (guide 문서 기반)
   - Critical/Major/Minor 이슈 분류
   - 구체적인 개선 제안
   - 좋은 점도 칭찬!
   ↓
3. 🧪 변경된 파일에 대한 테스트 코드 생성
   ↓
4. ✅ 생성된 테스트 자동 실행
   ↓
5. 📊 커버리지 리포트 생성
   ↓
6. 💬 PR에 결과 코멘트 추가
```

### Setup

#### 1. Anthropic API Key 발급
- https://console.anthropic.com 에서 API Key 생성

#### 2. GitHub Repository Secrets 추가
- Repository Settings → Secrets → Actions
- `ANTHROPIC_API_KEY` 추가

#### 3. PR 생성
```bash
# 새 기능 브랜치 생성
git checkout -b feature/new-feature

# 코드 작성
vim src/users/users.service.ts

# 커밋 & 푸시
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# PR 생성 → GitHub Actions 자동 실행!
```

### AI 리뷰 예시

PR에 다음과 같은 코멘트가 자동으로 달립니다:

```markdown
# 🤖 AI Code Review

## 📋 Review for users.service.ts

### 📊 Overall Assessment
- Score: 8/10
- Good implementation with proper error handling

### ✅ What's Good
- Clean separation of concerns
- Proper use of NestJS exceptions
- Email validation implemented correctly

### ⚠️ Issues Found

#### 🟡 Major
- Consider adding transaction for create/update operations
- Missing unit tests for edge cases

#### 🟢 Minor
- Variable naming could be more descriptive in getStats()

### 💡 Suggestions
... (구체적인 코드 개선 예시)
```

## 📖 Related Documentation

우리 팀의 개발 문화 문서:
- [Code Review Guidelines](https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md)
- [Coding Conventions](https://github.com/jcwa/guide/blob/main/CODING_CONVENTIONS.md)
- [Commit Convention](https://github.com/jcwa/guide/blob/main/COMMIT_CONVENTION.md)
- [Git Workflow](https://github.com/jcwa/guide/blob/main/GIT_WORKFLOW.md)
- [Lint Rules](https://github.com/jcwa/guide/blob/main/LINT_RULES.md)

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

## 🎯 Workflow Example

```bash
# 1. 새 기능 개발
git checkout -b feature/add-user-stats

# 2. 코드 작성
# src/users/users.service.ts에 getStats() 추가

# 3. 커밋
git add .
git commit -m "feat: add user statistics endpoint"

# 4. 푸시
git push origin feature/add-user-stats

# 5. PR 생성
# → AI가 자동으로:
#   - 코드 리뷰 (8/10점, 좋은 구현!)
#   - 테스트 생성 (users.service.spec.ts)
#   - 테스트 실행 (모두 통과!)
#   - 커버리지 계산 (85%)

# 6. 리뷰 확인 및 수정

# 7. 승인 후 머지
```

## 💰 예상 비용

**Claude API 비용** (Sonnet 4):
- Small PR (1-3 files): ~$0.05
- Medium PR (4-8 files): ~$0.15
- Large PR (9-15 files): ~$0.30

**월 예상** (PR 20개 기준): $2-4

매우 저렴합니다! ☕

## 🔧 Customization

### 리뷰 기준 변경
`scripts/ai-code-review.js`에서 프롬프트 수정

### 테스트 생성 범위 조정
`scripts/generate-tests.js`에서 파일 필터 수정

### 워크플로우 수정
`.github/workflows/pr-auto-test.yml` 편집

## 📝 License

UNLICENSED
