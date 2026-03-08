#!/usr/bin/env node

/**
 * AI Test Generator
 * - 변경된 파일에 대한 테스트 자동 생성
 * - 기존 테스트 파일이 없을 경우에만 생성
 */

const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.log('⚠️  ANTHROPIC_API_KEY not set. Skipping test generation.');
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
    console.log('⚠️  Could not get changed files:', error.message);
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
  console.log(`  🤖 Generating test for ${filepath}...`);
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `
You are a NestJS testing expert. Generate comprehensive Jest unit tests for the following code.

**File**: ${filepath}

**Source Code**:
\`\`\`typescript
${fileContent}
\`\`\`

**Requirements**:
1. Use NestJS testing patterns with @nestjs/testing
2. Test all public methods
3. Include success and error cases
4. Use proper mocking with jest.fn()
5. Aim for 80%+ code coverage
6. Generate ONLY executable test code (minimal comments)
7. Use describe/it blocks properly
8. Test edge cases and validation

**Output Format**:
Return ONLY the complete test file code. No explanations before or after.
Start directly with imports.
`
    }]
  });

  return message.content[0].text;
}

// 메인 실행
async function main() {
  console.log('🚀 AI Test Generator Starting...\n');

  const changedFiles = getChangedFiles();
  console.log(`📝 Changed files: ${changedFiles.length}`);

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
    console.log('✅ No source files to generate tests for.');
    return;
  }

  console.log(`🔍 Source files to test: ${sourceFiles.length}\n`);

  let generatedCount = 0;
  let skippedCount = 0;

  for (const filepath of sourceFiles) {
    const testFilePath = getTestFilePath(filepath);

    // 이미 테스트 파일이 있으면 스킵
    if (fs.existsSync(testFilePath)) {
      console.log(`  ⏭️  ${filepath} - Test already exists`);
      skippedCount++;
      continue;
    }

    const fileContent = readFile(filepath);
    if (!fileContent) {
      console.log(`  ⏭️  ${filepath} - Could not read file`);
      skippedCount++;
      continue;
    }

    try {
      const testCode = await generateTestCode(filepath, fileContent);
      
      // 테스트 파일 저장
      fs.writeFileSync(testFilePath, testCode, 'utf-8');
      console.log(`  ✅ ${testFilePath} - Generated`);
      generatedCount++;

      // API rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ ${filepath} - Failed:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Generated: ${generatedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log('\n✨ Done!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
