import { expect, test } from 'claude-code/testing'

import { BOUNCE, CHOICE, LABELS, mayAsk, tailOf } from '../hooks/logic'

type StageOn = Parameters<Parameters<typeof test>[1]>[1]

const TURN = { durationMs: 1, isAborted: false, reason: 'answer' } as const
const ASKING = '案は 2 つあります。A は速く、B は安全です。\n\nどちらにしますか？'
const PLAIN = '配備は成功です。差分は 0 に戻りました。'

test('返答の末尾に問いの目印があるかを見る（コードの中は見ない）', () => {
  expect(mayAsk(ASKING)).toBe(true)
  expect(mayAsk('🚦 色名を一言で教えてください')).toBe(true)
  expect(mayAsk('候補から 1 つ選んでください。')).toBe(true)
  expect(mayAsk(PLAIN)).toBe(false)
  expect(mayAsk('次を実行してください。\n\n```\n! echo どちらにしますか？\n```')).toBe(false)
  expect(mayAsk('`どれにしますか？` という文字列を検索しました。結果は 0 件です。')).toBe(false)
  expect(mayAsk(`どちらにしますか？\n${'報告の本文です。'.repeat(300)}`)).toBe(false)
  expect(tailOf('a `b` c')).toBe('a  c')
})

// kind= 判定の答え、classified= 判定に渡った文、sent= 送られた聞き直し
function stage(on: StageOn, kind: string | undefined, classified: string[], sent: string[]): void {
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('tool.call', () => ({ result: {} }))
  on('clock.after', () => ({ value: undefined }))
  on('session.model', () => ({ value: 'claude-fable-5-1' }))
  on('model.classify', ($, e) => {
    classified.push(e.text)

    return { value: kind }
  })
  on('prompt.submit', ($, e) => {
    sent.push(e.text)

    return { text: e.text }
  })
}

const START = { cwd: '/work', surface: null, isInteractive: true }
// タイマーの中の判定と送信が終わるのを待つ
const settle = () => new Promise(resolve => setTimeout(resolve, 120))

test('選んで答えられる問いが文章のまま残っていたら、聞き直しを 1 回送る', async ($, on) => {
  const classified: string[] = []
  const sent: string[] = []

  stage(on, CHOICE, classified, sent)
  await $.session.start(START)
  await $.turn.start({ text: '案を出して', turnId: 't1' })
  await $.turn.complete({ ...TURN, answer: ASKING, turnId: 't1' })
  await settle()

  expect(classified).toEqual([ASKING])
  expect(sent).toEqual([BOUNCE])
  // 利用者の発言と見分けがつくように、MOD の文は印つきの英語（2026-10-04）
  expect(BOUNCE.startsWith('[MOD ask-choice] ')).toBe(true)
  expect(/[ぁ-んァ-ヶ一-龠]/.test(BOUNCE)).toBe(false)

  // 聞き直しのあとのターンは、問いが残っていても見ない
  await $.turn.start({ text: BOUNCE, turnId: 't2' })
  await $.turn.complete({ ...TURN, answer: ASKING, turnId: 't2' })
  await settle()

  expect(sent).toEqual([BOUNCE])
})

test('AskUserQuestion を使ったターンと、問いの無い返答では何もしない', async ($, on) => {
  const classified: string[] = []
  const sent: string[] = []

  stage(on, CHOICE, classified, sent)
  await $.session.start(START)
  await $.turn.start({ text: 'x', turnId: 't1' })
  await $.tool.call({ tool: 'AskUserQuestion', questions: [] })
  await $.turn.complete({ ...TURN, answer: ASKING, turnId: 't1' })
  await $.turn.start({ text: 'y', turnId: 't2' })
  await $.turn.complete({ ...TURN, answer: PLAIN, turnId: 't2' })
  await settle()

  expect(classified).toEqual([])
  expect(sent).toEqual([])
})

test('自由に書く問い・問いなしと判定されたら送らない', async ($, on) => {
  const classified: string[] = []
  const sent: string[] = []

  stage(on, LABELS[1], classified, sent)
  await $.session.start(START)
  await $.turn.start({ text: 'x', turnId: 't1' })
  await $.turn.complete({ ...TURN, answer: ASKING, turnId: 't1' })
  await settle()

  expect(classified).toEqual([ASKING])
  expect(sent).toEqual([])
})

test('画面の無い実行・サブエージェントの返答・中断したターンでは何もしない', async ($, on) => {
  const classified: string[] = []
  const sent: string[] = []

  stage(on, CHOICE, classified, sent)
  await $.session.start({ ...START, isInteractive: false })
  await $.turn.complete({ ...TURN, answer: ASKING, turnId: 't1' })
  await $.session.start(START)
  await $.turn.complete({ ...TURN, answer: ASKING, turnId: 't2', agentId: 'agent-1' })
  await $.turn.complete({ ...TURN, reason: 'aborted', isAborted: true, answer: ASKING, turnId: 't3' })
  await settle()

  expect(classified).toEqual([])
  expect(sent).toEqual([])
})
