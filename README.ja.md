# claude-ask-choice

Claude Code のターミナル画面で使う、小さなプラグイン（MOD）です。返答の最後にある「選んで答えられる問い」を、選択式のメニューに変えます。
返答の最後に選んで答えられる問いが文章のまま残っていると、文章を打って答えることになるので、`AskUserQuestion` ツールで聞き直すようモデルに送り返し、選択肢から選べるようにします。

English: [README.md](README.md)

画面に出る文言は日本語です。

## 使いどころ

- Claude が返答の最後に、答えが数個に絞れる問いを文章のまま書いてきて、毎回答えを打ち返しているとき。
- Claude と日本語でやり取りしているとき。問いの目印には `?`・`？` のほか、「ですか」「ますか」「でしょうか」「ましょうか」の語尾が含まれます。
- 必要なところだけ聞き直してほしいとき。聞き直しは 1 つの問いに 1 回だけで、そのターンで既に `AskUserQuestion` を使っていれば何もしません。

向かないとき: 画面の無い実行（`claude -p`）で使う場合、問いで終わる返答ごとに分類の呼び出しが 1 回増えるのを避けたい場合、Windows で使う場合（未確認）。

## 動くとこう見える

選んで答えられる問いが文章のまま残った返答のあと、`[MOD ask-choice]` で始まる短い英語の文が、プラグインが送った文として画面に表示されます。続けてモデルが同じ問いを `AskUserQuestion` の選択式で聞き直します。問いの目印が無い返答はそのままです。

## 動作条件

- Claude Code のプラグインフック（MOD）API を使っています。この API は早期提供の段階で、版によって変わる可能性があります。
- Claude Code 2.1.287〜2.1.289・macOS で開発・確認しました。
- Windows は確認していません。

## 導入

このリポジトリをマーケットプレイスとして登録して入れます。

```
claude plugin marketplace add i-noma-ru/claude-ask-choice
claude plugin install ask-choice@claude-ask-choice
```

クローンして、そのセッションだけ読み込むこともできます。

```
claude --plugin-dir /path/to/claude-ask-choice
```

クローンを全セッションで読み込むには、環境変数 `CLAUDE_CODE_PLUGIN_DIRS` に `:` 区切りでフォルダを並べます。各項目はプラグインのフォルダそのものでも、プラグインのフォルダを入れた親フォルダでもかまいません（2.1.292 で両方を確認）。この環境変数は `claude --help` には出てこないので、変わる可能性があります。

## 動き

ターンの終わりに、返答の末尾（最後の 1500 字。コードブロックと行内コードは除く）を調べます。

1. 末尾に問いの目印が無ければ、何もしません。目印は、行末の `?`・`？`・「ですか」「ますか」「でしょうか」「ましょうか」、「選んでください」「教えてください」「返信してください」「決めてください」、記号 `🚦` です。
2. 目印があれば、セッションと同じモデルに、末尾を次の 3 つのどれかへ分類させます。選択肢から選んで答えられる問いがある／自由に書いて答える問いだけがある／利用者への問いは無い。
3. 1 つ目のときだけ、`AskUserQuestion` で聞き直すよう伝える短い英語の文（`[MOD ask-choice]` で始まる）を送ります。

次の場合は何もしません。そのターンで `AskUserQuestion` を使っている／画面の無い実行（`claude -p`）／サブエージェントの返答／中断やエラーで終わったターン／聞き直しを送った直後のターン（聞き直しは 1 つの問いに 1 回だけ）。

**費用:** 問いの目印がある返答ごとに分類の呼び出しが 1 回、聞き直しのたびにモデルの 1 ターンが増えます。目印の無い返答では何も呼びません。

送った文は、プラグインが送った文として画面に表示されます。

## 読むものと送るもの

このプラグインがセッションから読むものと、プロンプトに入れるものの全部です。送り先はいまの Claude Code セッションのモデルだけで、保存はしません。

**読むもの:** 終わったばかりの返答の本文（`turn.complete`）、ターンの終わり方、サブエージェントの返答かどうか、画面のある実行かどうか、そのターンで `AskUserQuestion` が呼ばれたかどうか。利用者の入力、ファイル、環境変数は読みません。

**分類に渡すもの:** 返答の末尾 1500 字（コードブロックと行内コードを除く）と、固定の分類ラベル 3 つ。Claude Code の `$.model.classify` を通じて、セッションと同じモデルに渡します。

**プロンプトとして送るもの:** 次の固定の英文 1 つだけです。毎回同じ文で、返答や会話の中身は一切含みません。

```
[MOD ask-choice] Your last reply left a pick-one question for the user in prose.
Re-ask it with AskUserQuestion: put the deciding facts and your recommendation in the question text and the option descriptions.
Do not repeat the report body. If the question truly needs a free-form answer, say so in one line.
```

## テスト

```
claude plugin validate .
claude plugin test .
```

## 補足

- AI（Claude Code）の支援を受けて書いています。
- 作者の環境で使っているものを取り出したプラグインです。ソースのコメントとテスト名は日本語です。
- 対になるプラグイン: [claude-clip-command](https://github.com/i-noma-ru/claude-clip-command)。2 本は独立していて、片方だけでも使えます。

## ライセンス

MIT です。[LICENSE](LICENSE) を参照してください。
