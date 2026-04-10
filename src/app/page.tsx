import Link from "next/link";

const demos = [
  {
    id: "demo1",
    title: "KYKシート",
    subtitle: "危険予知活動表の自動生成",
    description:
      "作業内容を入力するだけで、リスクアセスメント・安全対策を含むKYKシートをAIが自動生成します。",
    before: "30分",
    after: "30秒",
    href: "/demo1",
    color: "blue",
  },
  {
    id: "demo2",
    title: "施工計画書",
    subtitle: "4章分の施工計画書を自動生成",
    description:
      "工事情報を入力すると、過去案件を参考にAIが施工計画書（総則・工事概要・品質管理・安全衛生管理）を生成します。",
    before: "3日",
    after: "15分",
    href: "/demo2",
    color: "emerald",
  },
  {
    id: "demo3",
    title: "工事月報",
    subtitle: "月次報告書の自動生成",
    description:
      "当月の作業実績・進捗を入力すると、公共工事の文体に沿った工事月報をAIが作成します。",
    before: "3時間",
    after: "15分",
    href: "/demo3",
    color: "amber",
  },
] as const;

const colorMap = {
  blue: {
    card: "border-blue-200 hover:border-blue-400 hover:shadow-blue-100",
    badge: "bg-blue-100 text-blue-700",
    arrow: "text-blue-600",
    before: "text-red-500",
    after: "text-blue-600",
  },
  emerald: {
    card: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    arrow: "text-emerald-600",
    before: "text-red-500",
    after: "text-emerald-600",
  },
  amber: {
    card: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100",
    badge: "bg-amber-100 text-amber-700",
    arrow: "text-amber-600",
    before: "text-red-500",
    after: "text-amber-600",
  },
};

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          JTN AI Demo
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          AIで建設現場の書類作成を効率化。
          <br className="hidden sm:block" />
          3つのデモで時間短縮効果を体験できます。
        </p>
      </div>

      {/* Demo Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => {
          const colors = colorMap[demo.color];
          return (
            <Link
              key={demo.id}
              href={demo.href}
              className={`group block rounded-xl border-2 bg-white p-6 transition-all hover:shadow-lg ${colors.card}`}
            >
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${colors.badge}`}
              >
                {demo.id.toUpperCase()}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {demo.title}
              </h2>
              <p className="text-sm text-gray-500 mb-3">{demo.subtitle}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                {demo.description}
              </p>
              {/* Time comparison */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">従来</div>
                  <div className={`text-lg font-bold ${colors.before} line-through`}>
                    {demo.before}
                  </div>
                </div>
                <svg className={`w-5 h-5 ${colors.arrow} shrink-0`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">AI</div>
                  <div className={`text-lg font-bold ${colors.after}`}>
                    {demo.after}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
