#!/usr/bin/env node

/**
 * AI 코드 리뷰
 * - guide 문서 기반으로 코드 리뷰 수행
 * - 변경된 파일에 대해 상세한 리뷰 제공
 * - PR에 한글 코멘트 추가
 */

const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

if (!ANTHROPIC_API_KEY) {
  console.log('⚠️  ANTHROPIC_API_KEY not set. Skipping code review.');
  process.exit(0);
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// GitHub API 호출
async function githubAPI(endpoint, method = 'GET', data = null) {
  const url = `https://api.github.com/repos/${REPO}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

// 변경된 파일 목록
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only origin/main...HEAD').toString();
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('⚠️  Could not get changed files:', error.message);
    return [];
  }
}

// 파일 diff 가져오기
function getFileDiff(filepath) {
  try {
    return execSync(`git diff origin/main...HEAD -- ${filepath}`).toString();
  } catch (error) {
    return '';
  }
}

// 파일 내용 읽기
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch (error) {
    return '';
  }
}

// AI 코드 리뷰
async function reviewCode(filepath, fileContent, diff) {
  console.log(`  🔍 Reviewing ${filepath}...`);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `
당신은 우리 팀의 코드 리뷰 가이드라인을 따르는 시니어 개발자입니다.

**중요**: 모든 리뷰는 반드시 한글로 작성해주세요.

**리뷰 가이드라인**: https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md

**파일**: ${filepath}

**변경 사항 (diff)**:
\`\`\`diff
${diff}
\`\`\`

**전체 파일 내용**:
\`\`\`typescript
${fileContent}
\`\`\`

**리뷰 기준** (가이드라인 기반):
1. 🔴 **Critical (필수 수정)**:
   - 보안 취약점
   - 명백한 버그
   - 성능 문제 (N+1 쿼리, 메모리 누수)
   - 데이터 손실 위험

2. 🟡 **Major (권장 수정)**:
   - 코드 중복
   - 복잡한 로직 (리팩토링 필요)
   - 테스트 부족
   - 잘못된 설계 패턴

3. 🟢 **Minor (선택 수정)**:
   - 네이밍 개선
   - 주석 추가
   - 코드 스타일

**출력 형식** (반드시 한글로):
## 📋 ${path.basename(filepath)} 리뷰

### 📊 종합 평가
- 점수: X/10
- 한줄 요약

### ✅ 잘된 점
- 항목1
- 항목2

### ⚠️ 발견된 이슈
#### 🔴 Critical (필수 수정)
- (있다면)

#### 🟡 Major (권장 수정)
- (있다면)

#### 🟢 Minor (선택 수정)
- (있다면)

### 💡 개선 제안
구체적인 코드 개선 예시를 들어주세요.

**리뷰 시 유의사항**:
- 건설적이고 친절하게
- 구체적인 예시 포함
- 변경사항에 집중
- 실용적이고 실행 가능한 제안

이슈가 없어도 긍정적인 피드백과 점수를 제공해주세요!
`
    }]
  });

  return message.content[0].text;
}

// PR에 코멘트 추가
async function addReviewComment(review) {
  await githubAPI(`/issues/${PR_NUMBER}/comments`, 'POST', {
    body: review
  });
}

// 메인 실행
async function main() {
  console.log('🔍 AI 코드 리뷰 시작...\n');

  const changedFiles = getChangedFiles();
  console.log(`📝 변경된 파일: ${changedFiles.length}개`);

  // TypeScript/JavaScript 소스 파일만 필터링
  const codeFiles = changedFiles.filter(file =>
    (file.endsWith('.ts') || file.endsWith('.js')) &&
    !file.endsWith('.spec.ts') &&
    !file.endsWith('.test.ts') &&
    file.startsWith('src/')
  );

  if (codeFiles.length === 0) {
    console.log('✅ 리뷰할 코드 파일이 없습니다.');
    return;
  }

  console.log(`🔍 리뷰할 파일: ${codeFiles.length}개\n`);

  let fullReview = '# 🤖 AI 코드 리뷰\n\n';
  fullReview += `[코드 리뷰 가이드라인](https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md)을 기반으로 ${codeFiles.length}개 파일을 리뷰했습니다.\n\n`;
  fullReview += '---\n\n';

  for (const filepath of codeFiles) {
    const fileContent = readFile(filepath);
    const diff = getFileDiff(filepath);

    if (!fileContent || !diff) {
      console.log(`  ⏭️  ${filepath} - 스킵`);
      continue;
    }

    try {
      const review = await reviewCode(filepath, fileContent, diff);
      fullReview += review + '\n\n---\n\n';
      console.log(`  ✅ ${filepath} - 리뷰 완료`);

      // API rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ ${filepath} - 실패:`, error.message);
      fullReview += `## ❌ ${filepath} 리뷰 실패\n${error.message}\n\n---\n\n`;
    }
  }

  // 마무리
  fullReview += '\n## 📖 참고 자료\n\n';
  fullReview += '- [코드 리뷰 가이드라인](https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md)\n';
  fullReview += '- [코딩 컨벤션](https://github.com/jcwa/guide/blob/main/CODING_CONVENTIONS.md)\n';
  fullReview += '- [커밋 컨벤션](https://github.com/jcwa/guide/blob/main/COMMIT_CONVENTION.md)\n';
  fullReview += '\n---\n';
  fullReview += '*🤖 이 리뷰는 팀 가이드라인을 기반으로 Claude AI가 생성했습니다*';

  // PR에 코멘트 추가
  console.log('\n💬 PR에 리뷰 게시 중...');
  await addReviewComment(fullReview);

  console.log('✅ 코드 리뷰 완료!');
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
