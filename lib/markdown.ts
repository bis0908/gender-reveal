import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const changelogDirectory = path.join(process.cwd(), "content/changelog");

export interface ChangeLogEntry {
  slug: string;
  date: string;
  version: string;
  category: "feature" | "bugfix" | "improvement";
  content: string;
}

/**
 * changelog 디렉토리에서 모든 Markdown 파일을 읽어 파싱
 * @returns 날짜 기준 내림차순 정렬된 changelog 항목 배열
 */
export async function getChangeLogEntries(): Promise<ChangeLogEntry[]> {
  // changelog 디렉토리가 존재하지 않으면 빈 배열 반환
  if (!fs.existsSync(changelogDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(changelogDirectory);

  const allEntries = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".md"))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        const fullPath = path.join(changelogDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");

        // frontmatter와 content 분리
        const { data, content } = matter(fileContents);

        // Markdown을 HTML로 변환
        const processedContent = await remark().use(html).process(content);

        return {
          slug,
          date: data.date,
          version: data.version,
          category: data.category,
          content: processedContent.toString(),
        };
      }),
  );

  // 날짜 기준 내림차순 정렬 (최신 항목이 먼저)
  return allEntries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * 특정 slug의 changelog 항목 가져오기
 * @param slug - 파일명 (확장자 제외)
 * @returns changelog 항목 또는 null
 */
export async function getChangeLogEntry(
  slug: string,
): Promise<ChangeLogEntry | null> {
  try {
    const fullPath = path.join(changelogDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    const { data, content } = matter(fileContents);

    const processedContent = await remark().use(html).process(content);

    return {
      slug,
      date: data.date,
      version: data.version,
      category: data.category,
      content: processedContent.toString(),
    };
  } catch (error) {
    return null;
  }
}
