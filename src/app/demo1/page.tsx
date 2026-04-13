"use client";

import { useState } from "react";
import { triggerDownload } from "@/lib/filename";

interface KykRisk {
  危険: string;
  可能性: string;
  重大性: string;
  危険度: number;
  対策: string;
}

interface KykResult {
  作業内容: string[];
  リスク: KykRisk[];
  重点対策: string;
  安全指示: string;
}

const WEATHER_OPTIONS = ["晴れ", "曇り", "雨", "雪"];

export default function Demo1Page() {
  const [workContent, setWorkContent] = useState("各ふ頭の電力量計交換作業");
  const [weather, setWeather] = useState("晴れ");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KykResult | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/demo1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_description: workContent,
          weather,
          date,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API エラー (${res.status})`);
      }
      const data: KykResult = await res.json();
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
      const res = await fetch("/api/demo1?action=download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_description: workContent,
          weather,
          date,
        }),
      });
      if (!res.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await res.blob();
      triggerDownload(blob, `KYK_${date.replace(/-/g, "")}.xlsx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  };

  const ratingLabel = (level: number) => {
    if (level <= 2) return "bg-red-100 text-red-700";
    if (level <= 3) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 mb-3">
          DEMO1
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          KYKシート自動生成
        </h1>
        <p className="text-gray-500">
          作業内容を入力すると、AIがリスクアセスメント付きのKYKシートを生成します。
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">入力情報</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="workContent"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              作業内容
            </label>
            <textarea
              id="workContent"
              rows={3}
              value={workContent}
              onChange={(e) => setWorkContent(e.target.value)}
              placeholder="例: 各ふ頭の電力量計交換作業"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                作業日
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="weather"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                天候
              </label>
              <select
                id="weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white"
              >
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !workContent.trim()}
          className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Work Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              作業内容
            </h2>
            <ol className="space-y-1.5">
              {result.作業内容.map((item, i) => (
                <li key={i} className="text-sm text-gray-800 flex gap-2">
                  <span className="text-gray-400 shrink-0">
                    {["①", "②", "③", "④"][i]}
                  </span>
                  {item.replace(/^[①②③④]\s*/, "")}
                </li>
              ))}
            </ol>
          </div>

          {/* Risk Assessment Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              リスクアセスメント
            </h2>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="pb-2 pr-3 font-medium">#</th>
                    <th className="pb-2 pr-3 font-medium">予想される危険</th>
                    <th className="pb-2 pr-3 font-medium text-center">
                      可能性
                    </th>
                    <th className="pb-2 pr-3 font-medium text-center">
                      重大性
                    </th>
                    <th className="pb-2 pr-3 font-medium text-center">
                      危険度
                    </th>
                    <th className="pb-2 font-medium">安全対策</th>
                  </tr>
                </thead>
                <tbody>
                  {result.リスク.map((risk, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-3 pr-3 text-gray-400 align-top">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-3 text-gray-800 align-top max-w-48">
                        {risk.危険}
                      </td>
                      <td className="py-3 pr-3 text-center align-top">
                        {risk.可能性}
                      </td>
                      <td className="py-3 pr-3 text-center align-top">
                        {risk.重大性}
                      </td>
                      <td className="py-3 pr-3 text-center align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ratingLabel(risk.危険度)}`}
                        >
                          {risk.危険度}
                        </span>
                      </td>
                      <td className="py-3 text-gray-800 align-top max-w-56">
                        {risk.対策}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Measures */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                重点対策
              </h2>
              <p className="text-sm text-gray-800 leading-relaxed">
                {result.重点対策}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                安全指示
              </h2>
              <p className="text-sm text-gray-800 leading-relaxed">
                {result.安全指示}
              </p>
            </div>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
