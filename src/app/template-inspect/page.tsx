"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* 型定義                                                              */
/* ------------------------------------------------------------------ */

interface CfRule {
  type: string;
  priority: number;
  formula: string[];
}

interface ConditionalFormatting {
  range: string;
  rules: CfRule[];
}

interface DataValidation {
  range: string;
  type: string;
  formula1: string | null;
  allow_blank: boolean;
}

interface ImageInfo {
  size: string;
  anchor: string;
}

interface PrintSettings {
  paper_size: string;
  orientation: string;
  fit_to_width: number | null;
  fit_to_height: number | null;
  scale: number | null;
  print_area: string;
}

interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
  header: number;
  footer: number;
}

interface SheetResult {
  sheet_name: string;
  dimensions: string;
  conditional_formatting: ConditionalFormatting[];
  data_validations: DataValidation[];
  images: ImageInfo[];
  print_settings: PrintSettings;
  margins: Margins | null;
  merged_cells_count: number;
  merged_cells_sample: string[];
}

interface Risk {
  category: string;
  level: "high" | "medium" | "low";
  detail: string;
  mitigation: string;
}

interface TemplateSummary {
  conditional_formatting_count: number;
  data_validations_count: number;
  images_count: number;
  merged_cells_count: number;
}

interface TemplateResult {
  filename: string;
  file_extension: string;
  has_vba: boolean;
  sheet_count: number;
  sheets: SheetResult[];
  risks: Risk[];
  overall_risk: "high" | "medium" | "low";
  summary: TemplateSummary;
  demo: string;
  error?: string;
}

interface InspectResponse {
  total_templates: number;
  overall_summary: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  templates: TemplateResult[];
}

/* ------------------------------------------------------------------ */
/* ヘルパー                                                            */
/* ------------------------------------------------------------------ */

const RISK_STYLES = {
  high: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    label: "HIGH",
    labelJp: "高リスク",
    dot: "bg-red-500",
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    label: "MED",
    labelJp: "中リスク",
    dot: "bg-yellow-500",
  },
  low: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    label: "LOW",
    labelJp: "低リスク",
    dot: "bg-green-500",
  },
} as const;

function RiskBadge({ level }: { level: "high" | "medium" | "low" }) {
  const s = RISK_STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.labelJp}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* メインコンポーネント                                                 */
/* ------------------------------------------------------------------ */

export default function TemplateInspectPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspectResponse | null>(null);
  const [error, setError] = useState("");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const handleInspect = async () => {
    setError("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/template_inspect");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API エラー (${res.status})`);
      }
      const json: InspectResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "調査に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (filename: string) => {
    setExpandedTemplate((prev) => (prev === filename ? null : filename));
  };

  const demoLabel = (demo: string) => {
    const map: Record<string, string> = {
      demo1: "KYKシート",
      demo2: "施工計画書",
      demo3: "工事月報",
      reference: "参照データ",
    };
    return map[demo] || demo;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-700 mb-3 inline-block"
        >
          &larr; トップに戻る
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
            TOOL
          </span>
          <span className="text-xs text-gray-400">Issue #26</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          テンプレート破壊リスク調査
        </h1>
        <p className="text-gray-500 text-sm">
          openpyxlでExcelテンプレートを読み込み、マクロ・条件付き書式・画像等の破壊リスクを自動調査します。
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleInspect}
        disabled={loading}
        className="mb-8 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            調査中...
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            全テンプレートを調査
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-8">
          {/* Overall Summary */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              全体サマリー
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="テンプレート数"
                value={data.total_templates}
                accent="text-gray-900"
              />
              <StatCard
                label="高リスク"
                value={data.overall_summary.high_risk}
                accent="text-red-600"
              />
              <StatCard
                label="中リスク"
                value={data.overall_summary.medium_risk}
                accent="text-yellow-600"
              />
              <StatCard
                label="低リスク"
                value={data.overall_summary.low_risk}
                accent="text-green-600"
              />
            </div>
          </div>

          {/* Template Cards */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              テンプレート別調査結果
            </h2>
            <div className="space-y-4">
              {data.templates.map((tpl) => {
                const isExpanded = expandedTemplate === tpl.filename;
                const riskStyle = RISK_STYLES[tpl.overall_risk];

                return (
                  <div
                    key={tpl.filename}
                    className={`bg-white rounded-xl border ${
                      tpl.overall_risk === "high"
                        ? "border-red-200"
                        : tpl.overall_risk === "medium"
                          ? "border-yellow-200"
                          : "border-gray-200"
                    } overflow-hidden`}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => toggleExpand(tpl.filename)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <RiskBadge level={tpl.overall_risk} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {tpl.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {demoLabel(tpl.demo)} / {tpl.sheet_count}シート
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Quick stats */}
                        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                          {tpl.summary.conditional_formatting_count > 0 && (
                            <span className="flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${riskStyle.dot}`}
                              />
                              条件付き書式{" "}
                              {tpl.summary.conditional_formatting_count}
                            </span>
                          )}
                          {tpl.summary.data_validations_count > 0 && (
                            <span className="flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${riskStyle.dot}`}
                              />
                              入力規則 {tpl.summary.data_validations_count}
                            </span>
                          )}
                          {tpl.summary.images_count > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              画像 {tpl.summary.images_count}
                            </span>
                          )}
                          <span>
                            結合セル {tpl.summary.merged_cells_count}
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-6 py-5 space-y-6">
                        {/* Error */}
                        {tpl.error && (
                          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            エラー: {tpl.error}
                          </div>
                        )}

                        {/* Risks */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            検出されたリスク
                          </h3>
                          <div className="space-y-3">
                            {tpl.risks.map((risk, i) => (
                              <div
                                key={i}
                                className={`rounded-lg p-4 ${RISK_STYLES[risk.level].bg} ${RISK_STYLES[risk.level].border} border`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <RiskBadge level={risk.level} />
                                  <span className="text-sm font-semibold text-gray-800">
                                    {risk.category}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  {risk.detail}
                                </p>
                                <div className="bg-white/60 rounded-md px-3 py-2">
                                  <p className="text-xs font-medium text-gray-600 mb-0.5">
                                    対策方針
                                  </p>
                                  <p className="text-sm text-gray-800">
                                    {risk.mitigation}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sheet Details */}
                        {tpl.sheets?.map((sheet, si) => (
                          <div
                            key={si}
                            className="bg-gray-50 rounded-lg p-4 space-y-4"
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-700">
                                シート: {sheet.sheet_name}
                              </h3>
                              <span className="text-xs text-gray-400">
                                ({sheet.dimensions})
                              </span>
                            </div>

                            {/* Conditional Formatting */}
                            {sheet.conditional_formatting.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  条件付き書式 (
                                  {sheet.conditional_formatting.length}件)
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-200 text-left text-gray-500">
                                        <th className="pb-1 pr-3 font-medium">
                                          範囲
                                        </th>
                                        <th className="pb-1 pr-3 font-medium">
                                          種類
                                        </th>
                                        <th className="pb-1 font-medium">
                                          数式
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sheet.conditional_formatting.map(
                                        (cf, ci) =>
                                          cf.rules.map((rule, ri) => (
                                            <tr
                                              key={`${ci}-${ri}`}
                                              className="border-b border-gray-100 last:border-0"
                                            >
                                              <td className="py-1.5 pr-3 text-gray-700 font-mono">
                                                {cf.range}
                                              </td>
                                              <td className="py-1.5 pr-3 text-gray-700">
                                                {rule.type}
                                              </td>
                                              <td className="py-1.5 text-gray-700 font-mono">
                                                {rule.formula.join(", ") ||
                                                  "-"}
                                              </td>
                                            </tr>
                                          ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Data Validations */}
                            {sheet.data_validations.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  データ入力規則 (
                                  {sheet.data_validations.length}件)
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-200 text-left text-gray-500">
                                        <th className="pb-1 pr-3 font-medium">
                                          範囲
                                        </th>
                                        <th className="pb-1 pr-3 font-medium">
                                          種類
                                        </th>
                                        <th className="pb-1 font-medium">
                                          数式
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sheet.data_validations.map((dv, di) => (
                                        <tr
                                          key={di}
                                          className="border-b border-gray-100 last:border-0"
                                        >
                                          <td className="py-1.5 pr-3 text-gray-700 font-mono">
                                            {dv.range}
                                          </td>
                                          <td className="py-1.5 pr-3 text-gray-700">
                                            {dv.type}
                                          </td>
                                          <td className="py-1.5 text-gray-700 font-mono">
                                            {dv.formula1 || "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Images */}
                            {sheet.images.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  埋め込み画像 ({sheet.images.length}件)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {sheet.images.map((img, ii) => (
                                    <span
                                      key={ii}
                                      className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700"
                                    >
                                      <svg
                                        className="w-3 h-3 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                                        />
                                      </svg>
                                      {img.size}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Print Settings */}
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                印刷設定
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                <div className="bg-white rounded px-2.5 py-1.5 border border-gray-100">
                                  <span className="text-gray-500">
                                    用紙サイズ:{" "}
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {sheet.print_settings.paper_size}
                                  </span>
                                </div>
                                <div className="bg-white rounded px-2.5 py-1.5 border border-gray-100">
                                  <span className="text-gray-500">方向: </span>
                                  <span className="text-gray-800 font-medium">
                                    {sheet.print_settings.orientation}
                                  </span>
                                </div>
                                <div className="bg-white rounded px-2.5 py-1.5 border border-gray-100">
                                  <span className="text-gray-500">
                                    印刷範囲:{" "}
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {sheet.print_settings.print_area}
                                  </span>
                                </div>
                                {sheet.print_settings.scale && (
                                  <div className="bg-white rounded px-2.5 py-1.5 border border-gray-100">
                                    <span className="text-gray-500">
                                      倍率:{" "}
                                    </span>
                                    <span className="text-gray-800 font-medium">
                                      {sheet.print_settings.scale}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Merged Cells */}
                            {sheet.merged_cells_count > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  結合セル ({sheet.merged_cells_count}件)
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {sheet.merged_cells_sample.join(", ")}
                                  {sheet.merged_cells_count > 10 && " ..."}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
