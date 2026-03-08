#!/usr/bin/env node

/**
 * AI Code Review
 * - guide 문서 기반으로 코드 리뷰 수행
 * - 변경된 파일에 대해 상세한 리뷰 제공
 * - PR에 인라인 코멘트 추가
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
You are a senior code reviewer following our team's code review guidelines.

**Review Guidelines**: https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md

**File**: ${filepath}

**Changes (diff)**:
\`\`\`diff
${diff}
\`\`\`

**Full File Content**:
\`\`\`typescript
${fileContent}
\`\`\`

**Review Criteria** (from our guidelines):
1. 🔴 **Critical Issues** (Must Fix):
   - Security vulnerabilities
   - Obvious bugs
   - Performance problems (N+1 queries, memory leaks)
   - Data loss risks

2. 🟡 **Major Issues** (Recommended Fix):
   - Code duplication
   - Complex logic (needs refactoring)
   - Missing tests
   - Wrong design patterns

3. 🟢 **Minor Issues** (Optional):
   - Naming improvements
   - Missing comments
   - Code style (if not caught by linter)

**Output Format**:
## 📋 Review for ${path.basename(filepath)}

### 📊 Overall Assessment
- Score: X/10
- One-line summary

### ✅ What's Good
- Point 1
- Point 2

### ⚠️ Issues Found
#### 🔴 Critical
- (if any)

#### 🟡 Major
- (if any)

#### 🟢 Minor
- (if any)

### 💡 Suggestions
Specific code improvement suggestions with examples.

**Keep it**:
- Constructive and kind
- Specific with examples
- Focused on the changes
- Practical and actionable

If no issues found, still provide positive feedback and a score!
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
  console.log('🔍 AI Code Review Starting...\n');

  const changedFiles = getChangedFiles();
  console.log(`📝 Changed files: ${changedFiles.length}`);

  // TypeScript/JavaScript 소스 파일만 필터링
  const codeFiles = changedFiles.filter(file =>
    (file.endsWith('.ts') || file.endsWith('.js')) &&
    !file.endsWith('.spec.ts') &&
    !file.endsWith('.test.ts') &&
    file.startsWith('src/')
  );

  if (codeFiles.length === 0) {
    console.log('✅ No code files to review.');
    return;
  }

  console.log(`🔍 Files to review: ${codeFiles.length}\n`);

  let fullReview = '# 🤖 AI Code Review\n\n';
  fullReview += `Reviewed ${codeFiles.length} file(s) based on our [Code Review Guidelines](https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md).\n\n`;
  fullReview += '---\n\n';

  for (const filepath of codeFiles) {
    const fileContent = readFile(filepath);
    const diff = getFileDiff(filepath);

    if (!fileContent || !diff) {
      console.log(`  ⏭️  ${filepath} - Skipped`);
      continue;
    }

    try {
      const review = await reviewCode(filepath, fileContent, diff);
      fullReview += review + '\n\n---\n\n';
      console.log(`  ✅ ${filepath} - Reviewed`);

      // API rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ ${filepath} - Failed:`, error.message);
      fullReview += `## ❌ Review Failed for ${filepath}\n${error.message}\n\n---\n\n`;
    }
  }

  // 마무리
  fullReview += '\n## 📖 Resources\n\n';
  fullReview += '- [Code Review Guidelines](https://github.com/jcwa/guide/blob/main/CODE_REVIEW_GUIDE.md)\n';
  fullReview += '- [Coding Conventions](https://github.com/jcwa/guide/blob/main/CODING_CONVENTIONS.md)\n';
  fullReview += '- [Commit Convention](https://github.com/jcwa/guide/blob/main/COMMIT_CONVENTION.md)\n';
  fullReview += '\n---\n';
  fullReview += '*🤖 This review was generated by Claude AI based on team guidelines*';

  // PR에 코멘트 추가
  console.log('\n💬 Posting review to PR...');
  await addReviewComment(fullReview);

  console.log('✅ Code review completed!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
