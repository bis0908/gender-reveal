"use client";

import { useState } from "react";
import { AnimationRenderer } from "@/components/animation-renderer";
import { getAnimationOptions } from "@/lib/animations";
import type { AnimationType, Gender } from "@/lib/types";

/**
 * 🧪 애니메이션 테스트 전용 라우트.
 *
 * 토큰 생성·검증·카운트다운 등 모든 단계를 건너뛰고, 버튼 하나로 곧장 리빌 애니메이션을
 * 전체 화면 재생한다. 시각 검증(특히 풍선 터트리기/복권 긁기/상자 인터랙티브 피날레)을
 * 빠르게 반복하기 위한 개발용 도구이며 제품 흐름(`/create`·`/reveal`)에는 포함되지 않는다.
 *
 * 설계 메모:
 * - `onComplete` 는 의도적으로 넘기지 않는다. 실제 흐름은 onComplete 에서 애니메이션을
 *   언마운트하고 결과 화면으로 전환하지만, 여기서는 피날레가 사라지지 않고 화면에 남도록 한다.
 * - 처음부터 다시 보려면 "다시 재생"을 누른다 → `playKey` 증가로 서브트리를 리마운트한다.
 * - 인터랙티브 애니메이션(상자/풍선/긁기)은 화면의 요소를 직접 클릭/드래그해야 피날레가 뜬다.
 */

/** 성별 토글 항목 — 활성 시 색상은 표준 Tailwind 팔레트(핑크/블루)로 단순화. */
const GENDERS: { id: Gender; label: string; activeClass: string }[] = [
  { id: "girl", label: "여아 (Girl)", activeClass: "bg-pink-500 text-white" },
  { id: "boy", label: "남아 (Boy)", activeClass: "bg-blue-500 text-white" },
];

export default function TestAnimationPage() {
  const options = getAnimationOptions("ko");
  const [gender, setGender] = useState<Gender>("girl");
  const [selected, setSelected] = useState<AnimationType | null>(null);
  const [playKey, setPlayKey] = useState(0);

  const handleReplay = () => setPlayKey((k) => k + 1);
  const handleBack = () => setSelected(null);

  // 재생 화면 — 선택된 애니메이션을 전체 화면으로 표시한다.
  if (selected) {
    const current = options.find((o) => o.id === selected);
    return (
      <div className="relative h-screen w-full overflow-hidden bg-white">
        {/* 컨트롤 바 — 애니메이션 위에 떠 있되, 가운데 클릭 영역은 막지 않도록
            컨테이너는 pointer-events-none, 버튼만 pointer-events-auto 로 둔다. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-2 p-4">
          <button
            type="button"
            onClick={handleBack}
            className="pointer-events-auto rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/75"
          >
            ← 목록
          </button>
          <span className="pointer-events-none rounded-full bg-black/55 px-3 py-1 text-sm text-white">
            {current?.name} · {gender === "girl" ? "여아" : "남아"}
          </span>
          <button
            type="button"
            onClick={handleReplay}
            className="pointer-events-auto rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/75"
          >
            🔁 다시 재생
          </button>
        </div>

        {/* key 로 리마운트하여 항상 처음부터 재생한다(성별·애니메이션·재생 횟수 조합). */}
        <div key={`${selected}-${gender}-${playKey}`} className="h-full w-full">
          <AnimationRenderer
            gender={gender}
            animationType={selected}
            isRevealed
          />
        </div>
      </div>
    );
  }

  // 선택 화면 — 성별 토글 + 애니메이션 버튼.
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          🧪 테스트 전용
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          애니메이션 미리보기
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          모든 단계를 건너뛰고 버튼 하나로 리빌 애니메이션을 바로 재생합니다.
        </p>

        {/* 성별 토글 */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">성별</p>
          <div className="inline-flex rounded-full border border-slate-200 p-1">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  gender === g.id
                    ? g.activeClass
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 애니메이션 선택 */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">
            애니메이션 선택
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.id)}
                className="group flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {o.name}
                  {o.interactive && (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                      인터랙티브
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-400">{o.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
