"use client";

import { useState } from "react";
import { useOffline } from "../offline-provider";

interface ChapterResult {
  chapter: string;
  title: string;
  status: "pending" | "generating" | "done" | "error";
  content?: string;
  error?: string;
}

const CHAPTERS = [
  { key: "ch1", title: "第1章 総則" },
  { key: "ch2", title: "第2章 工事概要" },
  { key: "ch7", title: "第7章 品質管理" },
  { key: "ch8", title: "第8章 安全衛生管理" },
];

export default function Demo2Page() {
  const [projectName, setProjectName] = useState("各ふ頭電力量計更新工事");
  const [location, setLocation] = useState("横浜市各ふ頭");
  const [client, setClient] = useState("横浜市港湾局");
  const [scheduleStart, setScheduleStart] = useState("令和7年6月30日");
  const [scheduleEnd, setScheduleEnd] = useState("令和8年1月30日");
  const [workType, setWorkType] = useState(
    "電力量計更新（積算電力量計の取替）"
  );

  const { offline } = useOffline();
  const [chapters, setChapters] = useState<ChapterResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [usedOffline, setUsedOffline] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setUsedOffline(offline);

    const initial: ChapterResult[] = CHAPTERS.map((ch) => ({
      chapter: ch.key,
      title: ch.title,
      status: "pending",
    }));
    setChapters(initial);

    try {
      const url = offline ? "/api/demo2?offline=true" : "/api/demo2";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          location,
          client,
          schedule_start: scheduleStart,
          schedule_end: scheduleEnd,
          work_type: workType,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API エラー (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("ストリーム読み取りに失敗しました");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") continue;
          try {
            const event = JSON.parse(jsonStr);
            setChapters((prev) =>
              prev.map((ch) =>
                ch.chapter === event.chapter
                  ? {
                      ...ch,
                      status: event.status,
                      content: event.content || ch.content,
                      error: event.error,
                    }
                  : ch
              )
            );
          } catch {
            // skip non-JSON lines
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (chapterKey: string) => {
    try {
      const params = new URLSearchParams({ action: "download", chapter: chapterKey });
      if (offline) params.set("offline", "true");
      const res = await fetch(
        `/api/demo2?${params}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_name: projectName,
            location,
            client,
            schedule_start: scheduleStart,
            schedule_end: scheduleEnd,
            work_type: workType,
          }),
        }
      );
      if (!res.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ch = CHAPTERS.find((c) => c.key === chapterKey);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ch?.title || chapterKey}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました");
    }
  };

  const statusIcon = (status: ChapterResult["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        );
      case "generating":
        return (
          <svg
            className="animate-spin h-5 w-5 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        );
      case "done":
        return (
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 mb-3">
          DEMO2
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          施工計画書自動生成
        </h1>
        <p className="text-gray-500">
          工事情報を入力すると、過去案件を参考にAIが4章分の施工計画書を生成します。
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">工事情報</h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                工事名
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                工事場所
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="client"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                発注者
              </label>
              <input
                id="client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="scheduleStart"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                工期（着手）
              </label>
              <input
                id="scheduleStart"
                type="text"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="scheduleEnd"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                工期（完成）
              </label>
              <input
                id="scheduleEnd"
                type="text"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="workType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              工種
            </label>
            <input
              id="workType"
              type="text"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !projectName.trim()}
          className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {offline ? "キャッシュ読込中..." : "生成中..."}
            </>
          ) : offline ? (
            "キャッシュから生成"
          ) : (
            "AI生成"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Chapter Progress & Results */}
      {chapters.length > 0 && (
        <div className="space-y-4">
          {usedOffline && !generating && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              キャッシュデータを使用しています（オフラインモード）
            </div>
          )}
          <h2 className="text-sm font-semibold text-gray-700">生成結果</h2>
          {chapters.map((ch) => (
            <div
              key={ch.chapter}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(ch.status)}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {ch.status === "pending" && "待機中"}
                      {ch.status === "generating" && "生成中..."}
                      {ch.status === "done" && "完了"}
                      {ch.status === "error" && (ch.error || "エラー")}
                    </p>
                  </div>
                </div>
                {ch.status === "done" && (
                  <button
                    onClick={() => handleDownload(ch.chapter)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    ダウンロード
                  </button>
                )}
              </div>
              {ch.status === "done" && ch.content && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {ch.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
