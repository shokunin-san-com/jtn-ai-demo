"use client";

import { useState, useCallback } from "react";

type ErrorType =
  | "api_key_missing"
  | "api_call_failed"
  | "template_missing"
  | "reference_data_missing"
  | "output_dir_failed"
  | "network_error"
  | "unknown";

interface ChapterResult {
  chapter: string;
  title: string;
  status: "pending" | "generating" | "done" | "error";
  content?: string;
  error?: string;
  errorType?: ErrorType;
  errorDetail?: string;
}

interface GlobalError {
  message: string;
  errorType: ErrorType;
  detail?: string;
}

const CHAPTERS = [
  { key: "ch1", title: "第1章 総則" },
  { key: "ch2", title: "第2章 工事概要" },
  { key: "ch7", title: "第7章 品質管理" },
  { key: "ch8", title: "第8章 安全衛生管理" },
];

/** エラー種別ごとのユーザー向けガイダンス */
function getErrorGuidance(errorType: ErrorType, detail?: string): string {
  switch (errorType) {
    case "api_key_missing":
      return "AIサービスのAPIキーが設定されていません。管理者にAPIキーの設定を依頼してください。";
    case "template_missing":
      return detail
        ? `テンプレートファイルが見つかりません: ${detail}\n管理者にファイルの配置を確認してください。`
        : "テンプレートファイルが見つかりません。管理者にファイルの配置を確認してください。";
    case "reference_data_missing":
      return detail
        ? `参考データが見つかりません: ${detail}\n参考データ（赤レンガ倉庫等）が正しく配置されているか確認してください。`
        : "参考データが見つかりません。管理者にデータの配置を確認してください。";
    case "output_dir_failed":
      return "出力先ディレクトリの作成に失敗しました。ディスク容量やアクセス権限を確認してください。";
    case "api_call_failed":
      return "AI生成APIの呼び出しに失敗しました。しばらく待ってからリトライしてください。";
    case "network_error":
      return "ネットワーク接続に問題があります。接続状況を確認してからリトライしてください。";
    default:
      return "予期しないエラーが発生しました。管理者にお問い合わせください。";
  }
}

/** APIレスポンスからerror_typeを解析 */
function parseErrorType(body: Record<string, unknown>): ErrorType {
  const t = body.error_type as string | undefined;
  if (
    t === "api_key_missing" ||
    t === "api_call_failed" ||
    t === "template_missing" ||
    t === "reference_data_missing" ||
    t === "output_dir_failed"
  ) {
    return t;
  }
  return "unknown";
}

export default function Demo2Page() {
  const [projectName, setProjectName] = useState("各ふ頭電力量計更新工事");
  const [location, setLocation] = useState("横浜市各ふ頭");
  const [client, setClient] = useState("横浜市港湾局");
  const [scheduleStart, setScheduleStart] = useState("令和7年6月30日");
  const [scheduleEnd, setScheduleEnd] = useState("令和8年1月30日");
  const [workType, setWorkType] = useState(
    "電力量計更新（積算電力量計の取替）"
  );

  const [chapters, setChapters] = useState<ChapterResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [retryingChapter, setRetryingChapter] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<GlobalError | null>(null);
  const [downloadingChapter, setDownloadingChapter] = useState<string | null>(
    null
  );

  const getRequestPayload = useCallback(
    () => ({
      project_name: projectName,
      location,
      client,
      schedule_start: scheduleStart,
      schedule_end: scheduleEnd,
      work_type: workType,
    }),
    [projectName, location, client, scheduleStart, scheduleEnd, workType]
  );

  /** SSEストリームを処理し、章ごとの状態を更新 */
  const processStream = useCallback(
    async (
      res: Response,
      targetChapters?: string[]
    ) => {
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
            if (targetChapters && !targetChapters.includes(event.chapter)) {
              continue;
            }
            setChapters((prev) =>
              prev.map((ch) =>
                ch.chapter === event.chapter
                  ? {
                      ...ch,
                      status: event.status,
                      content: event.content || ch.content,
                      error: event.error,
                      errorType: event.error_type
                        ? parseErrorType({ error_type: event.error_type })
                        : undefined,
                      errorDetail: event.detail,
                    }
                  : ch
              )
            );
          } catch {
            // skip non-JSON lines
          }
        }
      }
    },
    []
  );

  /** 全章生成 */
  const handleGenerate = async () => {
    setGlobalError(null);
    setGenerating(true);

    const initial: ChapterResult[] = CHAPTERS.map((ch) => ({
      chapter: ch.key,
      title: ch.title,
      status: "pending",
    }));
    setChapters(initial);

    try {
      const res = await fetch("/api/demo2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getRequestPayload()),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorType = parseErrorType(body);
        setGlobalError({
          message:
            (body.error as string) || `API エラー (${res.status})`,
          errorType,
          detail: body.detail as string | undefined,
        });
        setChapters((prev) =>
          prev.map((ch) => ({ ...ch, status: "error" as const }))
        );
        return;
      }

      await processStream(res);
    } catch (e) {
      const isNetwork =
        e instanceof TypeError && e.message.includes("fetch");
      setGlobalError({
        message: e instanceof Error ? e.message : "生成に失敗しました",
        errorType: isNetwork ? "network_error" : "unknown",
      });
      // ストリーム途中で切断された場合、pending/generating状態の章をエラーにする
      setChapters((prev) =>
        prev.map((ch) =>
          ch.status === "pending" || ch.status === "generating"
            ? { ...ch, status: "error" as const, error: "通信が中断されました" }
            : ch
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  /** 個別章リトライ */
  const handleRetryChapter = async (chapterKey: string) => {
    setRetryingChapter(chapterKey);
    setChapters((prev) =>
      prev.map((ch) =>
        ch.chapter === chapterKey
          ? { ...ch, status: "generating" as const, error: undefined, errorType: undefined, errorDetail: undefined }
          : ch
      )
    );

    try {
      const res = await fetch("/api/demo2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...getRequestPayload(),
          retry_chapters: [chapterKey],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setChapters((prev) =>
          prev.map((ch) =>
            ch.chapter === chapterKey
              ? {
                  ...ch,
                  status: "error" as const,
                  error: (body.error as string) || `リトライ失敗 (${res.status})`,
                  errorType: parseErrorType(body),
                  errorDetail: body.detail as string | undefined,
                }
              : ch
          )
        );
        return;
      }

      await processStream(res, [chapterKey]);

      // ストリーム完了後、まだgeneratingのままなら完了していない
      setChapters((prev) =>
        prev.map((ch) =>
          ch.chapter === chapterKey && ch.status === "generating"
            ? { ...ch, status: "error" as const, error: "レスポンスが不完全です" }
            : ch
        )
      );
    } catch (e) {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.chapter === chapterKey
            ? {
                ...ch,
                status: "error" as const,
                error: e instanceof Error ? e.message : "リトライに失敗しました",
              }
            : ch
        )
      );
    } finally {
      setRetryingChapter(null);
    }
  };

  /** 失敗した全章をリトライ */
  const handleRetryAllFailed = async () => {
    const failedKeys = chapters
      .filter((ch) => ch.status === "error")
      .map((ch) => ch.chapter);
    if (failedKeys.length === 0) return;

    setGlobalError(null);
    setGenerating(true);
    setChapters((prev) =>
      prev.map((ch) =>
        failedKeys.includes(ch.chapter)
          ? { ...ch, status: "generating" as const, error: undefined, errorType: undefined, errorDetail: undefined }
          : ch
      )
    );

    try {
      const res = await fetch("/api/demo2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...getRequestPayload(),
          retry_chapters: failedKeys,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorType = parseErrorType(body);
        setGlobalError({
          message: (body.error as string) || `API エラー (${res.status})`,
          errorType,
          detail: body.detail as string | undefined,
        });
        setChapters((prev) =>
          prev.map((ch) =>
            failedKeys.includes(ch.chapter)
              ? { ...ch, status: "error" as const }
              : ch
          )
        );
        return;
      }

      await processStream(res, failedKeys);

      setChapters((prev) =>
        prev.map((ch) =>
          failedKeys.includes(ch.chapter) && ch.status === "generating"
            ? { ...ch, status: "error" as const, error: "レスポンスが不完全です" }
            : ch
        )
      );
    } catch (e) {
      setChapters((prev) =>
        prev.map((ch) =>
          failedKeys.includes(ch.chapter) &&
          (ch.status === "generating" || ch.status === "pending")
            ? {
                ...ch,
                status: "error" as const,
                error: e instanceof Error ? e.message : "リトライに失敗しました",
              }
            : ch
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (chapterKey: string) => {
    setDownloadingChapter(chapterKey);
    try {
      const res = await fetch(
        `/api/demo2?action=download&chapter=${chapterKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getRequestPayload()),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body.error as string) || "ダウンロードに失敗しました"
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ch = CHAPTERS.find((c) => c.key === chapterKey);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ch?.title || chapterKey}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setGlobalError({
        message: e instanceof Error ? e.message : "ダウンロードに失敗しました",
        errorType: "unknown",
      });
    } finally {
      setDownloadingChapter(null);
    }
  };

  const failedCount = chapters.filter((ch) => ch.status === "error").length;
  const doneCount = chapters.filter((ch) => ch.status === "done").length;
  const hasPartialSuccess = doneCount > 0 && failedCount > 0;

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
              生成中...
            </>
          ) : (
            "AI生成"
          )}
        </button>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {globalError.message}
                </p>
                <p className="text-xs text-red-600 mt-1 whitespace-pre-line">
                  {getErrorGuidance(globalError.errorType, globalError.detail)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
              aria-label="閉じる"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Partial Success Banner */}
      {hasPartialSuccess && !generating && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm text-amber-800">
                {doneCount}章が生成完了、{failedCount}章が失敗しました。成功した章はダウンロード可能です。
              </p>
            </div>
            <button
              onClick={handleRetryAllFailed}
              disabled={generating}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              失敗した章をリトライ
            </button>
          </div>
        </div>
      )}

      {/* Chapter Progress & Results */}
      {chapters.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">生成結果</h2>
          {chapters.map((ch) => (
            <div
              key={ch.chapter}
              className={`bg-white rounded-xl border p-5 ${
                ch.status === "error"
                  ? "border-red-200"
                  : "border-gray-200"
              }`}
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
                      {ch.status === "error" && (
                        <span className="text-red-500">
                          {ch.error || "エラー"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* リトライボタン（章ごとエラー時） */}
                  {ch.status === "error" && !generating && (
                    <button
                      onClick={() => handleRetryChapter(ch.chapter)}
                      disabled={retryingChapter !== null}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {retryingChapter === ch.chapter ? (
                        <svg
                          className="animate-spin w-4 h-4"
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
                      ) : (
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
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                          />
                        </svg>
                      )}
                      リトライ
                    </button>
                  )}
                  {/* ダウンロードボタン（成功時） */}
                  {ch.status === "done" && (
                    <button
                      onClick={() => handleDownload(ch.chapter)}
                      disabled={downloadingChapter === ch.chapter}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {downloadingChapter === ch.chapter ? (
                        <svg
                          className="animate-spin w-4 h-4"
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
                      ) : (
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
                      )}
                      ダウンロード
                    </button>
                  )}
                </div>
              </div>
              {/* エラー詳細（章ごとのガイダンス） */}
              {ch.status === "error" && ch.errorType && (
                <div className="mt-3 pt-3 border-t border-red-100">
                  <p className="text-xs text-red-600 whitespace-pre-line">
                    {getErrorGuidance(ch.errorType, ch.errorDetail)}
                  </p>
                </div>
              )}
              {/* 生成結果 */}
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
