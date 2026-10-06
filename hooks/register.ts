import type { EngineInterface, Register } from 'claude-code'

import { BOUNCE, CHOICE, LABELS, mayAsk, tailOf } from './logic'

// 問いの種類をモデルに判定させ、選んで答えられる問いなら聞き直しを送る
async function judgeAndBounce($: EngineInterface, answer: string, onBounce: () => void): Promise<void> {
  const kind = await $.model.classify(tailOf(answer), LABELS, { model: await $.session.model() })

  if (kind !== CHOICE) {
    return
  }

  onBounce()
  await $.prompt.submit({ text: BOUNCE })
}

export const register: Register = on => {
  // 画面の無い実行（claude -p）では何もしない
  let isInteractive = false
  // このターンで AskUserQuestion が使われた
  let isAsked = false
  // 直前に聞き直しを送った（その次のターンは見ない。聞き直しは 1 回だけ）
  let isBounced = false

  on('session.start', async ($, e, next) => {
    isInteractive = e.isInteractive

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    isAsked = false

    return next(e)
  })

  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    isAsked = true

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)

    if (!isInteractive || e.agentId !== undefined || e.reason !== 'answer') {
      return done
    }

    if (isBounced) {
      isBounced = false

      return done
    }

    if (isAsked || !mayAsk(e.answer)) {
      return done
    }

    // 判定は返答の表示を待たせないよう、ターンが閉じたあとに行う（フックの中から別の入力は送れない）
    $.clock.after(50, () => {
      judgeAndBounce($, e.answer, () => {
        isBounced = true
      }).catch(() => {
        // 判定や送信に失敗しても、返答はそのまま
      })
    })

    return done
  })
}
