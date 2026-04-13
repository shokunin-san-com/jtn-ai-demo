/**
 * クロスプラットフォーム対応のダウンロードファイル名ユーティリティ。
 *
 * 日本語（マルチバイト）ファイル名は、OS によって Unicode 正規化形式が
 * 異なるため問題を起こしやすい。
 *   - macOS (HFS+/APFS): NFD（分解形）
 *   - Windows / Linux  : NFC（合成形）
 *
 * 例: 「ガ」は NFC では U+30AC の1コードポイント、
 *      NFD では U+30AB + U+3099 の2コードポイントになる。
 *
 * ブラウザのダウンロード属性 (`a.download`) や Content-Disposition で
 * NFD のまま渡すと、Windows 側で濁点が分離表示されたり、
 * 後続のファイル操作で一致しなくなる事故が発生する。
 *
 * 加えて Windows では以下の文字がファイル名に使用できない:
 *   \ / : * ? " < > |
 *
 * 本ユーティリティは以下を行う:
 *   1. NFC への正規化
 *   2. Windows 禁止文字を全角・代替文字へ置換
 *   3. 制御文字 / 前後空白の除去
 */

const WINDOWS_FORBIDDEN_CHAR_MAP: Record<string, string> = {
  "\\": "＼",
  "/": "／",
  ":": "：",
  "*": "＊",
  "?": "？",
  '"': "”",
  "<": "＜",
  ">": "＞",
  "|": "｜",
};

const WINDOWS_FORBIDDEN_PATTERN = /[\\/:*?"<>|]/g;
const CONTROL_CHAR_PATTERN = /[\x00-\x1f\x7f]/g;

/**
 * ダウンロードに使用するファイル名を、macOS / Windows 双方で
 * 同一に見えるよう正規化する。
 */
export function normalizeDownloadFilename(raw: string): string {
  const nfc = raw.normalize("NFC");
  const replaced = nfc.replace(
    WINDOWS_FORBIDDEN_PATTERN,
    (ch) => WINDOWS_FORBIDDEN_CHAR_MAP[ch] ?? "_",
  );
  return replaced.replace(CONTROL_CHAR_PATTERN, "").trim();
}

/**
 * Blob を受け取り、正規化済みファイル名でブラウザにダウンロードさせる。
 * 呼び出し側で毎回 URL の生成・解放・<a> 操作を書かないで済むようラップ。
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = normalizeDownloadFilename(filename);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
