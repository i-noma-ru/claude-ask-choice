// 返答の末尾のうち、問いを探す範囲（文字数）。長い報告の途中にある問いかけの引用を拾わないため
const TAIL_CHARS = 1500

// 問いの目印: 🚦、行末の疑問、返事を求める言い回し
const ASK_PATTERNS = [
  /🚦/,
  /(?:[?？]|ですか|ますか|でしょうか|ましょうか)[」』）)。]*\s*$/m,
  /(?:選んで|教えて|返信して|決めて)ください/,
]

export const CHOICE = '選択肢から選んで答えられる問いがある'
export const LABELS = [CHOICE, '自由に書いて答える問いだけがある', '利用者への問いは無い'] as const

/**
 * 差し戻すときに主担当へ送る文。画面では利用者の発言と同じ見た目で出るので、
 * 見分けがつくように印つきの英語にする（2026-10-04・利用者は読まなくてよい）
 */
export const BOUNCE = [
  '[MOD ask-choice] Your last reply left a pick-one question for the user in prose.',
  'Re-ask it with AskUserQuestion: put the deciding facts and your recommendation in the question text and the option descriptions.',
  'Do not repeat the report body. If the question truly needs a free-form answer, say so in one line.',
].join('\n')

/** コードブロックと行内コードを除いた、返答の末尾 */
export function tailOf(answer: string): string {
  const prose = answer.replace(/```[\s\S]*?(?:```|$)/g, '').replace(/`[^`\n]*`/g, '')

  return prose.slice(-TAIL_CHARS)
}

/** 返答の末尾に、問いの目印があるか（ここで絞ってから、モデルに種類を判定させる） */
export function mayAsk(answer: string): boolean {
  const tail = tailOf(answer)

  return ASK_PATTERNS.some(pattern => pattern.test(tail))
}
