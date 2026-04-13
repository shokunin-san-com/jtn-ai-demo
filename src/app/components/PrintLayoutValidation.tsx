"use client";

import { useId, useMemo, useState } from "react";

export type PrintLayoutAccent = "blue" | "emerald" | "amber";

export interface PrintLayoutExpected {
  /** 用紙サイズ (例: "A4") */
  paperSize: string;
  /** 用紙方向 (例: "縦" / "横") */
  orientation: string;
  /** 余白 (例: "上下 1.9cm / 左右 1.8cm") */
  margins: string;
  /** 拡大縮小 (例: "1ページに収まるよう縮小") */
  scaling: string;
  /** フォント (例: "MS Pゴシック 11pt") */
  font: string;
  /** 想定ページ数 (例: "1ページ") */
  pageCount: string;
}

interface PrintLayoutValidationProps {
  /** 検証対象のテンプレート名 (例: "KYKシート.xlsx") */
  templateName: string;
  /** 想定の印刷レイアウト情報（元テンプレートの値） */
  expected: PrintLayoutExpected;
  /** デモカラーに合わせたアクセント */
  accent?: PrintLayoutAccent;
  /** 有効になる条件（ダウンロード後のみ検証可能など） */
  enabled?: boolean;
}

const ACCENT: Record<
  PrintLayoutAccent,
  {
    badge: string;
    check: string;
    ring: string;
    border: string;
    subtle: string;
  }
> = {
  blue: {
    badge: "bg-blue-100 text-blue-700",
    check: "text-blue-600",
    ring: "focus:ring-blue-500",
    border: "border-blue-200",
    subtle: "bg-blue-50",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    check: "text-emerald-600",
    ring: "focus:ring-emerald-500",
    border: "border-emerald-200",
    subtle: "bg-emerald-50",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700",
    check: "text-amber-600",
    ring: "focus:ring-amber-500",
    border: "border-amber-200",
    subtle: "bg-amber-50",
  },
};

/**
 * 印刷レイアウトOK基準チェックリスト
 *
 * KYKシート・施工計画書・月報は毎回印刷して提出される。
 * openpyxl保存後も元テンプレートと同じレイアウトに収まるか、
 * ユーザー側で印刷プレビューを見ながら検証するためのUI。
 *
 * Issue: #27 (#0-5: 印刷レイアウト検証をOK基準に追加)
 */
export default function PrintLayoutValidation({
  templateName,
  expected,
  accent = "blue",
  enabled = true,
}: PrintLayoutValidationProps) {
  const color = ACCENT[accent];
  const prefix = useId();

  const criteria = useMemo(
    () => [
      {
        id: "pages",
        label: "印刷プレビューで元テンプレートと同じページ数に収まる",
        hint: `期待: ${expected.pageCount}`,
      },
      {
        id: "paper",
        label: "用紙サイズ・方向が元テンプレートと同じ",
        hint: `期待: ${expected.paperSize} / ${expected.orientation}`,
      },
      {
        id: "margins",
        label: "余白・拡大縮小が元テンプレートと同じ",
        hint: `期待: ${expected.margins}（${expected.scaling}）`,
      },
      {
        id: "font",
        label: "フォント・フォントサイズが元テンプレートと同じ",
        hint: `期待: ${expected.font}`,
      },
    ],
    [expected]
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const passedCount = criteria.reduce(
    (sum, c) => sum + (checked[c.id] ? 1 : 0),
    0
  );
  const allPassed = passedCount === criteria.length;

  const toggle = (id: string) => {
    if (!enabled) return;
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        allPassed ? color.border : "border-gray-200"
      } ${!enabled ? "opacity-60" : ""}`}
      aria-disabled={!enabled}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${color.badge}`}
            >
              印刷レイアウト検証
            </span>
            {allPassed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                OK基準クリア
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-gray-900">
            元テンプレートと同じレイアウトで印刷できるか確認
          </h2>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            ダウンロードしたExcelをExcelの「印刷プレビュー」で開き、
            <span className="font-medium text-gray-700">
              {` ${templateName} `}
            </span>
            と同じ見え方になっているかを確認してください。
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-gray-400">進捗</div>
          <div className="text-sm font-semibold text-gray-800 tabular-nums">
            {passedCount} / {criteria.length}
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {criteria.map((c) => {
          const id = `${prefix}-${c.id}`;
          const isChecked = !!checked[c.id];
          return (
            <li key={c.id}>
              <label
                htmlFor={id}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  isChecked
                    ? `${color.border} ${color.subtle}`
                    : "border-gray-200 hover:border-gray-300"
                } ${enabled ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={isChecked}
                  disabled={!enabled}
                  onChange={() => toggle(c.id)}
                  className={`mt-0.5 h-4 w-4 rounded border-gray-300 ${color.check} ${color.ring}`}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm ${
                      isChecked ? "text-gray-900" : "text-gray-800"
                    }`}
                  >
                    {c.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.hint}</div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      {!enabled && (
        <p className="mt-3 text-xs text-gray-400">
          Excelをダウンロードすると検証できます。
        </p>
      )}
    </div>
  );
}
