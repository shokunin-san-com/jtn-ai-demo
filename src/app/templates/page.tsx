"use client";

import { useState, useEffect } from "react";

interface TemplateFile {
  name: string;
  path: string;
  subcategory: string | null;
  size: number;
}

interface TemplateCategory {
  category: string;
  title: string;
  color: string;
  files: TemplateFile[];
}

const colorMap: Record<string, { badge: string; border: string; icon: string }> = {
  blue: {
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    icon: "text-blue-600",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    icon: "text-emerald-600",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    icon: "text-amber-600",
  },
  gray: {
    badge: "bg-gray-100 text-gray-700",
    border: "border-gray-200",
    icon: "text-gray-500",
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function TemplatesPage() {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/templates?action=list")
      .then((res) => {
        if (!res.ok) throw new Error(`API エラー (${res.status})`);
        return res.json();
      })
      .then((data: TemplateCategory[]) => setCategories(data))
      .catch((e) => setError(e instanceof Error ? e.message : "読み込み失敗"))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const res = await fetch(
        `/api/templates?action=download&path=${encodeURIComponent(filePath)}`
      );
      if (!res.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました");
    }
  };

  const totalFiles = categories.reduce((sum, c) => sum + c.files.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 mb-3">
          TEMPLATES
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          テンプレート管理
        </h1>
        <p className="text-gray-500">
          各デモで使用するExcelテンプレートと参考データの一覧です。
          {!loading && !error && (
            <span className="ml-1 text-gray-400">
              ({categories.length}カテゴリ / {totalFiles}ファイル)
            </span>
          )}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <svg
            className="animate-spin h-6 w-6 text-gray-400 mx-auto mb-3"
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
          <p className="text-sm text-gray-400">テンプレートを読み込み中...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Categories */}
      {!loading && !error && (
        <div className="space-y-6">
          {categories.map((cat) => {
            const colors = colorMap[cat.color] || colorMap.gray;

            // reference カテゴリはサブカテゴリでグループ化
            const subcategories = cat.files.reduce<
              Record<string, TemplateFile[]>
            >((acc, f) => {
              const key = f.subcategory || "";
              if (!acc[key]) acc[key] = [];
              acc[key].push(f);
              return acc;
            }, {});

            return (
              <div
                key={cat.category}
                className={`bg-white rounded-xl border-2 ${colors.border} overflow-hidden`}
              >
                {/* Category Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}
                    >
                      {cat.category.toUpperCase()}
                    </span>
                    <h2 className="text-sm font-bold text-gray-900">
                      {cat.title}
                    </h2>
                  </div>
                  <span className="text-xs text-gray-400">
                    {cat.files.length}ファイル
                  </span>
                </div>

                {/* File List */}
                <div className="divide-y divide-gray-50">
                  {Object.entries(subcategories).map(([sub, files]) => (
                    <div key={sub}>
                      {sub && (
                        <div className="px-6 pt-3 pb-1">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {sub}
                          </span>
                        </div>
                      )}
                      {files.map((file) => (
                        <div
                          key={file.path}
                          className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <svg
                              className={`w-5 h-5 shrink-0 ${colors.icon}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                              />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleDownload(file.path, file.name)
                            }
                            className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-medium ${colors.icon} hover:opacity-70 transition-opacity`}
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
                            DL
                          </button>
                        </div>
                      ))}
                    </div>
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
