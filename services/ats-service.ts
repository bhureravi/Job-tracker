import type { Profile } from "@/types/profile";

export type AtsAnalysis = {
  score: number;
  level: "Strong match" | "Moderate match" | "Needs work";
  jdKeywords: string[];
  matchedSkills: string[];
  missingKeywords: string[];
  prepFocus: string[];
  practiceQuestions: string[];
  summaryLine: string;
};

const KEYWORD_BANK = [
  "typescript",
  "javascript",
  "react",
  "next.js",
  "nextjs",
  "node.js",
  "node",
  "express",
  "postgresql",
  "postgres",
  "supabase",
  "mongodb",
  "tailwind",
  "redux",
  "api",
  "rest",
  "graphql",
  "sql",
  "docker",
  "aws",
  "git",
  "html",
  "css",
  "testing",
  "jest",
  "data structures",
  "algorithms",
  "system design",
  "authentication",
  "authorization",
  "responsive design",
  "deployment",
  "performance",
  "debugging",
  "problem solving",
  "communication",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "you",
  "are",
  "will",
  "have",
  "has",
  "our",
  "their",
  "about",
  "role",
  "job",
  "intern",
  "internship",
  "required",
  "responsibilities",
  "responsibility",
  "skills",
  "skill",
  "experience",
  "team",
  "work",
  "working",
  "build",
  "develop",
  "developing",
  "good",
  "strong",
]);

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function splitCommaList(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function extractKeywords(text: string) {
  const normalized = normalize(text);

  const directMatches = KEYWORD_BANK.filter((keyword) =>
    normalized.includes(keyword)
  );

  if (directMatches.length > 0) {
    return unique(directMatches);
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (token.length < 4) continue;
    if (STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function keywordMatch(a: string, b: string) {
  const aa = normalize(a).trim();
  const bb = normalize(b).trim();
  return aa === bb || aa.includes(bb) || bb.includes(aa);
}

function buildPracticeQuestions(keywords: string[]) {
  const questions: string[] = [];

  for (const keyword of keywords.slice(0, 4)) {
    questions.push(`How have you used ${keyword} in a project?`);
    questions.push(`What trade-offs would you consider when using ${keyword}?`);
  }

  return questions.slice(0, 6);
}

export function buildAtsAnalysis(jdText: string, profile: Profile | null): AtsAnalysis {
  const jdKeywords = extractKeywords(jdText);
  const skills = splitCommaList(profile?.core_skills).map((skill) => skill.toLowerCase());

  const matchedSkills = jdKeywords.filter((keyword) =>
    skills.some((skill) => keywordMatch(skill, keyword))
  );

  const missingKeywords = jdKeywords.filter(
    (keyword) => !matchedSkills.some((match) => keywordMatch(match, keyword))
  );

  const profileSize = Math.max(skills.length, 1);
  const jdSize = Math.max(jdKeywords.length, 1);

  const score = Math.min(
    100,
    Math.round((matchedSkills.length / profileSize) * 70 + (matchedSkills.length / jdSize) * 30)
  );

  const level: AtsAnalysis["level"] =
    score >= 80 ? "Strong match" : score >= 50 ? "Moderate match" : "Needs work";

  const prepFocus = missingKeywords.slice(0, 5).map((keyword) => `Revise ${keyword}`);
  const practiceQuestions = buildPracticeQuestions(missingKeywords);

  const summaryLine =
    matchedSkills.length > 0
      ? `Your profile matches ${matchedSkills.length} useful keyword${matchedSkills.length === 1 ? "" : "s"} from the JD.`
      : "No direct keyword match yet. Add stronger skills in Settings.";

  return {
    score,
    level,
    jdKeywords,
    matchedSkills,
    missingKeywords,
    prepFocus,
    practiceQuestions,
    summaryLine,
  };
}