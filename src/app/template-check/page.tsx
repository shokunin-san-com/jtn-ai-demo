"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  型定義                                                             */
/* ------------------------------------------------------------------ */

interface ConditionalFormat {
  sheet: string;
  range: string;
  rules_count: number;
}

interface DataValidation {
  sheet: string;
  type: string;
  range: string;
  formula1: string | null;
}

interface ImageInfo {
  sheet: string;
  width: number | null;
  height: number | null;
}

interface PrintSettings {
  paper_size: number;
  paper_size_name: string;
  orientation: string;
  print_area: string | null;
  fit_to_width: number | null;
  fit_to_height: number | null;
  top_margin: number | null;
  bottom_margin: number | null;
  left_margin: number | null;
  right_margin: number | null;
}

interface TemplateResult {
  file: string;
  path: string;
  extension: string;
  vba_macros: boolean;
  sheets: string[];
  conditional_formatting: ConditionalFormat[];
  data_validations: DataValidation[];
  images: ImageInfo[];
  print_settings: Record<string, PrintSettings>;
  risks: string[];
  status: "ok" | "warning" | "danger" | "error";
}

interface DemoGroup {
  title: string;
  color: string;
  templates: TemplateResult[];
}

interface Summary {
  total_files: number;
  ok_count: number;
  warning_count: number;
  danger_count: number;
  recommendations: string[];
}

interface CheckResult {
  groups: Record<string, DemoGroup>;
  summary: Summary;
}

/* ------------------------------------------------------------------ */
/*  ステータスUI                                                       */
/* ------------------------------------------------------------------ */

const statusConfig = {
  ok: { label: "問題なし", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  warning: { label: "要確認", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  danger: { label: "要対策", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  error: { label: "エラー", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

const groupColor: Record<string, { badge: string; accent: string; ring: string }> = {
  blue: { badge: "bg-blue-100 text-blue-700", accent: "border-blue-300", ring: "ring-blue-200" },
  emerald: { badge: "bg-emerald-100 text-emerald-700", accent: "border-emerald-300", ring: "ring-emerald-200" },
  amber: { badge: "bg-amber-100 text-amber-700", accent: "border-amber-300", ring: "ring-amber-200" },
};

/* ------------------------------------------------------------------ */
/*  コンポーネント                                                      */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: TemplateResult["status"] }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon || <CheckIcon />}
      <span className="text-gray-500 shrink-0 w-28">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

function TemplateCard({ template }: { template: TemplateResult }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[template.status];

  return (
    <div className={`rounded-lg border ${cfg.border} bg-white overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <FileIcon />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{template.file}</div>
          <div className="text-xs text-gray-400">
            {template.sheets.length} シート · {template.extension}
          </div>
        </div>
        <StatusBadge status={template.status} />
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Detail */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* 調査項目一覧 */}
          <div className="space-y-2">
            <DetailRow
              label="VBAマクロ"
              value={template.vba_macros ? "あり" : "なし（.xlsx）"}
              icon={template.vba_macros ? <DangerIcon /> : <CheckIcon />}
            />
            <DetailRow
              label="条件付き書式"
              value={
                template.conditional_formatting.length > 0
                  ? `${template.conditional_formatting.length} 件`
                  : "なし"
              }
              icon={template.conditional_formatting.length > 0 ? <WarningIcon /> : <CheckIcon />}
            />
            <DetailRow
              label="データ入力規則"
              value={
                template.data_validations.length > 0
                  ? `${template.data_validations.length} 件`
                  : "なし"
              }
              icon={template.data_validations.length > 0 ? <WarningIcon /> : <CheckIcon />}
            />
            <DetailRow
              label="埋め込み画像"
              value={
                template.images.length > 0
                  ? `${template.images.length} 件`
                  : "なし"
              }
              icon={template.images.length > 0 ? <DangerIcon /> : <CheckIcon />}
            />
          </div>

          {/* 条件付き書式の詳細 */}
          {template.conditional_formatting.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                条件付き書式の詳細
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-1.5 pr-3 font-medium">シート</th>
                      <th className="pb-1.5 pr-3 font-medium">範囲</th>
                      <th className="pb-1.5 font-medium">ルール数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.conditional_formatting.map((cf, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pr-3 text-gray-700">{cf.sheet}</td>
                        <td className="py-1.5 pr-3 text-gray-700 font-mono">{cf.range}</td>
                        <td className="py-1.5 text-gray-700">{cf.rules_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* データ入力規則の詳細 */}
          {template.data_validations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                データ入力規則の詳細
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-1.5 pr-3 font-medium">シート</th>
                      <th className="pb-1.5 pr-3 font-medium">種類</th>
                      <th className="pb-1.5 pr-3 font-medium">範囲</th>
                      <th className="pb-1.5 font-medium">値</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.data_validations.map((dv, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pr-3 text-gray-700">{dv.sheet}</td>
                        <td className="py-1.5 pr-3 text-gray-700">{dv.type}</td>
                        <td className="py-1.5 pr-3 text-gray-700 font-mono">{dv.range}</td>
                        <td className="py-1.5 text-gray-700 font-mono truncate max-w-32">
                          {dv.formula1 || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 画像の詳細 */}
          {template.images.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                埋め込み画像の詳細
              </h4>
              <div className="space-y-1">
                {template.images.map((img, i) => (
                  <div key={i} className="text-xs text-gray-700">
                    シート「{img.sheet}」
                    {img.width && img.height && ` — ${img.width}×${img.height}px`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 印刷設定 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              印刷設定
            </h4>
            {Object.entries(template.print_settings).map(([sheet, ps]) => (
              <div key={sheet} className="mb-2 last:mb-0">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  シート「{sheet}」
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-700 pl-2">
                  <span>用紙: {ps.paper_size_name}</span>
                  <span>向き: {ps.orientation}</span>
                  {ps.print_area && <span>印刷範囲: {ps.print_area}</span>}
                  {ps.fit_to_width && <span>幅に合わせる: {ps.fit_to_width}ページ</span>}
                  {ps.fit_to_height && <span>高さに合わせる: {ps.fit_to_height}ページ</span>}
                  {ps.top_margin != null && (
                    <span>余白: 上{ps.top_margin}cm 下{ps.bottom_margin}cm 左{ps.left_margin}cm 右{ps.right_margin}cm</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* リスク */}
          {template.risks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                リスク・注意事項
              </h4>
              <ul className="space-y-1">
                {template.risks.map((risk, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  メインページ                                                       */
/* ------------------------------------------------------------------ */

export default function TemplateCheckPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/template-check");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API エラー (${res.status})`);
      }
      const data: CheckResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "調査に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 mb-3">
          調査ツール
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          テンプレート互換性チェック
        </h1>
        <p className="text-gray-500">
          openpyxl で各Excelテンプレートを調査し、マクロ・条件付き書式・画像等の破壊リスクを確認します。
        </p>
      </div>

      {/* 調査実行ボタン */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">調査対象</h2>
        <p className="text-sm text-gray-500 mb-4">
          Demo1（KYKシート）・Demo2（施工計画書）・Demo3（工事月報）の全テンプレートファイルを対象に、
          VBAマクロ・条件付き書式・データ入力規則・埋め込み画像・印刷設定を調査します。
        </p>
        <button
          onClick={handleCheck}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              調査中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              調査を実行
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* サマリー */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">調査結果サマリー</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-2xl font-bold text-gray-900">{result.summary.total_files}</div>
                <div className="text-xs text-gray-500 mt-0.5">ファイル数</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-700">{result.summary.ok_count}</div>
                <div className="text-xs text-green-600 mt-0.5">問題なし</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-700">{result.summary.warning_count}</div>
                <div className="text-xs text-yellow-600 mt-0.5">要確認</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-700">{result.summary.danger_count}</div>
                <div className="text-xs text-red-600 mt-0.5">要対策</div>
              </div>
            </div>

            {/* 推奨事項 */}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              推奨事項
            </h3>
            <ul className="space-y-1.5">
              {result.summary.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                  </svg>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* デモグループ別結果 */}
          {Object.entries(result.groups).map(([key, group]) => {
            const colors = groupColor[group.color] || groupColor.blue;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {key.toUpperCase()}
                  </span>
                  <h2 className="text-base font-bold text-gray-900">{group.title}</h2>
                  <span className="text-xs text-gray-400">
                    ({group.templates.length} ファイル)
                  </span>
                </div>
                <div className="space-y-3">
                  {group.templates.map((tpl) => (
                    <TemplateCard key={tpl.path} template={tpl} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
