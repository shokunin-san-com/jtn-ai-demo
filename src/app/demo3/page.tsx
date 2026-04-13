"use client";

import { useState } from "react";
import PrintLayoutValidation, {
  type PrintLayoutExpected,
} from "../components/PrintLayoutValidation";

interface GeppoResult {
  工事報告: string;
  作業概要: string;
  出来高: {
    当月: number;
    累計: number;
  };
}

const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

// 元テンプレート（工事月報）の印刷レイアウト
const GEPPO_PRINT_LAYOUT: PrintLayoutExpected = {
  paperSize: "A4",
  orientation: "縦",
  margins: "上下 1.9cm / 左右 1.8cm",
  scaling: "1ページに収まるよう縮小",
  font: "ＭＳ ゴシック 10.5pt",
  pageCount: "1ページ",
};

export default function Demo3Page() {
  const [targetMonth, setTargetMonth] = useState("10月");
  const [workSummary, setWorkSummary] = useState(
    "大さん橋ふ頭・山下ふ頭の電力量計取替作業を実施。計8台の交換完了。"
  );
  const [progress, setProgress] = useState("45");
  const [workerCount, setWorkerCount] = useState("3");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeppoResult | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleGenerate = async () => {
    setError("");
    setResult(null);
    setDownloaded(false);
    setLoading(true);

    try {
      const res = await fetch("/api/demo3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_month: targetMonth,
          work_summary: workSummary,
          progress: Number(progress),
          worker_count: Number(workerCount),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API エラー (${res.status})`);
      }
      const data: GeppoResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/demo3?action=download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_month: targetMonth,
          work_summary: workSummary,
          progress: Number(progress),
          worker_count: Number(workerCount),
        }),
      });
      if (!res.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `工事月報（${targetMonth}）.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 mb-3">
          DEMO3
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          工事月報自動生成
        </h1>
        <p className="text-gray-500">
          当月の実績を入力すると、AIが公共工事の文体で工事月報を作成します。
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">月次情報</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="targetMonth"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                対象月
              </label>
              <select
                id="targetMonth"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors bg-white"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="progress"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                進捗率 (%)
              </label>
              <input
                id="progress"
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="workerCount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                作業員数
              </label>
              <input
                id="workerCount"
                type="number"
                min={1}
                value={workerCount}
                onChange={(e) => setWorkerCount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="workSummary"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              作業概要
            </label>
            <textarea
              id="workSummary"
              rows={3}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="例: 大さん橋ふ頭の電力量計取替作業を実施。"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !workSummary.trim()}
          className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
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
              AI生成中...
            </>
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

      {/* Result Preview */}
      {result && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              出来高
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-gray-500">当月出来高</span>
                  <span className="text-sm font-semibold text-amber-700">
                    {result.出来高.当月}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${result.出来高.当月}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-gray-500">累計出来高</span>
                  <span className="text-sm font-semibold text-amber-700">
                    {result.出来高.累計}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${result.出来高.累計}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Text */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              工事報告（その2）
            </h2>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {result.工事報告}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              作業概要
            </h2>
            <p className="text-sm text-gray-800 leading-relaxed">
              {result.作業概要}
            </p>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-600 px-5 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? (
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
                ダウンロード中...
              </>
            ) : (
              <>
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
                Excelダウンロード
              </>
            )}
          </button>

          {/* 印刷レイアウト検証 OK基準 (Issue #27) */}
          <PrintLayoutValidation
            templateName="工事月報テンプレート"
            expected={GEPPO_PRINT_LAYOUT}
            accent="amber"
            enabled={downloaded}
          />
        </div>
      )}
    </div>
  );
}
