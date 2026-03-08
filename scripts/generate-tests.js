#!/usr/bin/env node

/**
 * AI 테스트 생성기
 * - 변경된 파일에 대한 테스트 자동 생성
 * - 기존 테스트 파일이 없을 경우에만 생성
 * - 한글 주석과 설명으로 생성
 */

const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.log('⚠️  ANTHROPIC_API_KEY가 설정되지 않았습니다. 테스트 생성을 건너뜁니다.');
  process.exit(0);
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// 변경된 파일 목록
function getChangedFiles() {
  try {
    // PR 환경에서는 base branch와 비교
    const output = execSync('git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached').toString();
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('⚠️  변경된 파일을 가져올 수 없습니다:', error.message);
    return [];
  }
}

// 파일 읽기
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch (error) {
    return '';
  }
}

// 테스트 파일 경로 계산
function getTestFilePath(sourceFile) {
  const dir = path.dirname(sourceFile);
  const basename = path.basename(sourceFile, '.ts');
  return path.join(dir, `${basename}.spec.ts`);
}

// AI로 테스트 코드 생성
async function generateTestCode(filepath, fileContent) {
  console.log(`  🤖 ${filepath} 테스트 생성 중...`);
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `
당신은 NestJS 테스트 전문가입니다. 다음 코드에 대한 포괄적인 Jest 단위 테스트를 생성해주세요.

**중요**: 모든 주석과 설명은 반드시 한글로 작성해주세요.

**파일**: ${filepath}

**소스 코드**:
\`\`\`typescript
${fileContent}
\`\`\`

**요구사항**:
1. @nestjs/testing을 사용한 NestJS 테스트 패턴 적용
2. 모든 public 메서드 테스트
3. 성공 케이스와 에러 케이스 모두 포함
4. jest.fn()을 사용한 적절한 모킹
5. 80% 이상의 코드 커버리지 목표
6. 실행 가능한 테스트 코드만 생성 (주석은 한글로 간결하게)
7. describe/it 블록 적절히 사용
8. 엣지 케이스와 유효성 검사 테스트

**describe/it 블록은 한글로 작성**:
- describe('UserService', () => {
- describe('create', () => {
- it('유효한 데이터로 사용자를 생성해야 함', async () => {
- it('중복된 이메일로 생성 시 에러를 던져야 함', async () => {

**출력 형식**:
완전한 테스트 파일 코드만 반환하세요. 설명은 제외하고 import문부터 바로 시작하세요.
모든 주석과 describe/it 텍스트는 한글로 작성하세요.
`
    }]
  });

  return message.content[0].text;
}

// 메인 실행
async function main() {
  console.log('🚀 AI 테스트 생성기 시작...\n');

  const changedFiles = getChangedFiles();
  console.log(`📝 변경된 파일: ${changedFiles.length}개`);

  // TypeScript 소스 파일만 필터링 (테스트 파일 제외)
  const sourceFiles = changedFiles.filter(file =>
    file.endsWith('.ts') &&
    !file.endsWith('.spec.ts') &&
    !file.endsWith('.test.ts') &&
    !file.endsWith('.e2e-spec.ts') &&
    file.startsWith('src/') &&
    !file.includes('main.ts') &&
    !file.includes('.dto.ts') &&
    !file.includes('.entity.ts') &&
    !file.includes('.module.ts')
  );

  if (sourceFiles.length === 0) {
    console.log('✅ 테스트를 생성할 소스 파일이 없습니다.');
    return;
  }

  console.log(`🔍 테스트 생성 대상 파일: ${sourceFiles.length}개\n`);

  let generatedCount = 0;
  let skippedCount = 0;

  for (const filepath of sourceFiles) {
    const testFilePath = getTestFilePath(filepath);

    // 이미 테스트 파일이 있으면 스킵
    if (fs.existsSync(testFilePath)) {
      console.log(`  ⏭️  ${filepath} - 테스트가 이미 존재함`);
      skippedCount++;
      continue;
    }

    const fileContent = readFile(filepath);
    if (!fileContent) {
      console.log(`  ⏭️  ${filepath} - 파일을 읽을 수 없음`);
      skippedCount++;
      continue;
    }

    try {
      const testCode = await generateTestCode(filepath, fileContent);
      
      // 테스트 파일 저장
      fs.writeFileSync(testFilePath, testCode, 'utf-8');
      console.log(`  ✅ ${testFilePath} - 생성 완료`);
      generatedCount++;

      // API rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ ${filepath} - 실패:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n📊 요약:');
  console.log(`  ✅ 생성됨: ${generatedCount}개`);
  console.log(`  ⏭️  스킵됨: ${skippedCount}개`);
  console.log('\n✨ 완료!');
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
