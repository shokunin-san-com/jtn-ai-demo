interface ValidationItem {
  name: string;
  template_value: string;
  actual_value: string;
  passed: boolean;
}

export type { ValidationItem };

interface PrintLayoutValidationProps {
  items: ValidationItem[];
}

export default function PrintLayoutValidation({
  items,
}: PrintLayoutValidationProps) {
  if (!items || items.length === 0) return null;

  const allPassed = items.every((item) => item.passed);
  const passedCount = items.filter((item) => item.passed).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">
            印刷レイアウト検証
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            元テンプレートとの印刷設定の一致を検証
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            allPassed
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {allPassed ? (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          {allPassed
            ? `ALL PASSED (${passedCount}/${items.length})`
            : `FAILED (${passedCount}/${items.length})`}
        </span>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="pb-2 pr-3 font-medium">検証項目</th>
              <th className="pb-2 pr-3 font-medium">テンプレート</th>
              <th className="pb-2 pr-3 font-medium">出力結果</th>
              <th className="pb-2 font-medium text-center">判定</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-2.5 pr-3 text-gray-800 font-medium align-top">
                  {item.name}
                </td>
                <td className="py-2.5 pr-3 text-gray-600 align-top">
                  {item.template_value}
                </td>
                <td className="py-2.5 pr-3 text-gray-600 align-top">
                  {item.actual_value}
                </td>
                <td className="py-2.5 text-center align-top">
                  {item.passed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      NG
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
