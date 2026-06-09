"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";
import { buildAtsAnalysis } from "@/services/ats-service";

const supabase = createClient();

export default function ATSAnalyzer({
  jdText,
}: {
  jdText: string | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile((data as Profile) ?? null);
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const analysis = useMemo(() => {
    return buildAtsAnalysis(jdText ?? "", profile);
  }, [jdText, profile]);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading ATS analysis...</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold">ATS Match Analysis</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This compares your saved skill bank with the keywords found in the job description.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
        >
          Update Skills
        </button>
      </div>

      {!jdText ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          No job description saved yet. Add JD text in the application form to unlock ATS scoring.
        </div>
      ) : !profile || !profile.core_skills ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Add core skills in Settings to generate your ATS score and keyword matches.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MetricCard label="Score" value={`${analysis.score}/100`} />
            <MetricCard label="Level" value={analysis.level} />
            <MetricCard label="Matched" value={analysis.matchedSkills.length} />
            <MetricCard label="Missing" value={analysis.missingKeywords.length} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ListCard
              title="Matched skills"
              items={analysis.matchedSkills.length > 0 ? analysis.matchedSkills : ["No direct match yet"]}
            />
            <ListCard
              title="Missing keywords"
              items={analysis.missingKeywords.length > 0 ? analysis.missingKeywords : ["No major gaps detected"]}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TextCard title="Prep focus" items={analysis.prepFocus} emptyText="Nothing to revise yet." />
            <TextCard
              title="Practice questions"
              items={analysis.practiceQuestions}
              emptyText="No practice questions generated yet."
            />
          </div>

          <div className="mt-6 rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">How this score works</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysis.summaryLine}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="rounded-lg border px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-lg border px-3 py-2">
              {item}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}