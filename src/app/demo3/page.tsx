"use client";

import { useState } from "react";
import { useOffline } from "../offline-provider";

interface GeppoResult {
  工事報告: string;
  作業概要: string;
  出来高: {
    当月: number;
    累計: number;
  };
}

interface ApiError {
  error: string;
  error_type?: string;
  detail?: string | string[];
}

const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

const ERROR_ICON: Record<string, string> = {
  api_key_missing: "🔑",
  template_missing: "📄",
  reference_missing: "📁",
  validation_error: "⚠️",
  api_call_failed: "🌐",
  output_dir_failed: "💾",
};

const ERROR_HINT: Record<string, string> = {
  api_key_missing:
    "サーバーの環境変数を確認してください。解決しない場合は管理者にお問い合わせください。",
  template_missing:
    "templates/demo3/ フォルダにテンプレートExcelファイルが配置されているか確認してください。",
  reference_missing:
    "templates/reference/geppo/ フォルダに参考データが配置されているか確認してください。",
  api_call_failed:
    "しばらく待ってから再度お試しください。問題が続く場合は管理者にお問い合わせください。",
  output_dir_failed:
    "サーバーのディスク容量・権限を確認してください。",
};

function validateForm(fields: {
  workSummary: string;
  progress: string;
  workerCount: string;
}): string[] {
  const errors: string[] = [];
  if (!fields.workSummary.trim()) {
    errors.push("作業概要を入力してください");
  }
  const prog = Number(fields.progress);
  if (fields.progress === "" || isNaN(prog)) {
    errors.push("進捗率を入力してください");
  } else if (prog < 0 || prog > 100) {
    errors.push("進捗率は0〜100の範囲で入力してください");
  }
  const wc = Number(fields.workerCount);
  if (fields.workerCount === "" || isNaN(wc)) {
    errors.push("作業員数を入力してください");
  } else if (wc < 1) {
    errors.push("作業員数は1人以上を入力してください");
  }
  return errors;
}

export default function Demo3Page() {
  const [targetMonth, setTargetMonth] = useState("10月");
  const [workSummary, setWorkSummary] = useState(
    "大さん橋ふ頭・山下ふ頭の電力量計取替作業を実施。計8台の交換完了。"
  );
  const [progress, setProgress] = useState("45");
  const [workerCount, setWorkerCount] = useState("3");

  const { offline } = useOffline();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeppoResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [usedOffline, setUsedOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setFieldErrors([]);

    // --- クライアント側バリデーション ---
    const clientErrors = validateForm({ workSummary, progress, workerCount });
    if (clientErrors.length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    setUsedOffline(offline);

    try {
      const url = offline ? "/api/demo3?offline=true" : "/api/demo3";
      const res = await fetch(url, {
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
        const body: ApiError = await res.json().catch(() => ({
          error: `API エラー (${res.status})`,
        }));
        setError(body);
        return;
      }

      const data: GeppoResult = await res.json();
      setResult(data);
    } catch {
      setError({
        error: "サーバーに接続できませんでした",
        error_type: "api_call_failed",
        detail: "ネットワーク接続を確認してください。",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ action: "download" });
      if (offline) params.set("offline", "true");
      const res = await fetch(`/api/demo3?${params}`, {
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
        const body: ApiError = await res.json().catch(() => ({
          error: "ダウンロードに失敗しました",
        }));
        setError(body);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `工事月報（${targetMonth}）.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError({
        error: "ダウンロードに失敗しました",
        error_type: "api_call_failed",
        detail: "ネットワーク接続を確認してください。",
      });
    } finally {
      setDownloading(false);
    }
  };

  const clearFieldError = () => {
    if (fieldErrors.length > 0) setFieldErrors([]);
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
                onChange={(e) => {
                  setProgress(e.target.value);
                  clearFieldError();
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors ${
                  fieldErrors.some((e) => e.includes("進捗率"))
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                }`}
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
                onChange={(e) => {
                  setWorkerCount(e.target.value);
                  clearFieldError();
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors ${
                  fieldErrors.some((e) => e.includes("作業員数"))
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                }`}
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
              onChange={(e) => {
                setWorkSummary(e.target.value);
                clearFieldError();
              }}
              placeholder="例: 大さん橋ふ頭の電力量計取替作業を実施。"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors ${
                fieldErrors.some((e) => e.includes("作業概要"))
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300"
              }`}
            />
          </div>
        </div>

        {/* フィールドバリデーションエラー */}
        {fieldErrors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <ul className="space-y-1">
              {fieldErrors.map((fe, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>{fe}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
              {offline ? "キャッシュ読込中..." : "AI生成中..."}
            </>
          ) : offline ? (
            "キャッシュから生成"
          ) : (
            "AI生成"
          )}
        </button>
      </div>

      {/* APIエラー表示 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0 mt-0.5">
              {ERROR_ICON[error.error_type || ""] || "❌"}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">
                {error.error}
              </p>
              {/* detail: 文字列 or 配列 */}
              {error.detail && (
                typeof error.detail === "string" ? (
                  <p className="mt-1 text-sm text-red-700">{error.detail}</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {error.detail.map((d, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                        <span className="shrink-0">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}
              {/* 対処法ヒント */}
              {error.error_type && ERROR_HINT[error.error_type] && (
                <p className="mt-2 text-xs text-red-600 bg-red-100 rounded px-2 py-1">
                  💡 {ERROR_HINT[error.error_type]}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result Preview */}
      {result && (
        <div className="space-y-6">
          {usedOffline && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              キャッシュデータを使用しています（オフラインモード）
            </div>
          )}
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
        </div>
      )}
    </div>
  );
}
