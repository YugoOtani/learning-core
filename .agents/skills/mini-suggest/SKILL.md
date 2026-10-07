---
name: mini-suggest
description: 実装したい内容と現在のコードを確認し、データ・制御の流れに沿って、人間が短時間で判断できる非常に小さなmicrotask候補を最大10件、変更差分とともに提示する。
---

# 目的

実装したい最終状態と現在のコードを確認し、現在地点から次に進めるためのmicrotask候補を最大10件提示する。

最終状態までの完全な実装計画は作らない。

ユーザーは提示された候補と変更差分を見て、必要なmicrotaskだけを選び `mini-impl` で実装する。

その後、本スキルを再実行し、変更後のコードを改めて確認して次の候補を生成する。

このスキルでは実装しない。

# 基本方針

microtaskは、

**人間が変更差分を短時間で確認し、その変更だけを承認・修正できる最小の実装意図**

とする。

機能として完成している必要はない。

以下のような小さな変更も、単独のmicrotaskとして扱ってよい。

- 引数を1つ追加する
- 戻り値型を変更する
- フィールドを1つ追加する
- 型を1つ追加する
- クラスのプレースホルダを追加する
- 関数やメソッドのプレースホルダを追加する
- interfaceにメソッドを1つ追加する
- 既存APIを1箇所呼び出す
- 値を次の処理へ渡す
- 戻り値を呼び出し元で受け取る
- 条件分岐を1つ追加する
- 既存処理の呼び出し先を1箇所変更する

コード量ではなく、判断の小ささを優先する。

# microtaskの粒度

1件のmicrotaskでは、原則として1つの変更意図だけを扱う。

たとえば、

- `loadConfig` に `path: string` 引数を追加する
- `ConfigLoader` クラスのプレースホルダを追加する
- `load` メソッドの戻り値型を `Config` にする
- `response.body` を `parseResponse` に渡す

程度の粒度を許可する。

以下のような複数の変更を1件にまとめない。

悪い例:

- `ConfigLoader` を追加して設定ファイルを読み込み、パースして返す
- APIを呼び出してレスポンスを解析し、画面に表示する
- `mode` を追加してpreview時の処理を実装する

必要であれば、これらを数個から十数個のmicrotaskへ分解する。

ただし、以下のような純粋な編集操作までは分割しない。

- importを追加する
- 空行を追加する
- 括弧を閉じる
- formatterを実行する
- 型エラーを消すためだけに構文を調整する

microtaskには「なぜその変更をするか」を説明できる最小限の意図が必要である。

# シナリオを基準にする

microtaskは、コード上の依存関係ではなく、原則として**対象機能のデータ・制御の流れ**に沿って並べる。

まず、対象機能について主要な実行シナリオを把握する。

たとえば、

`UI → ViewModel → UseCase → Repository → API → Repository → ViewModel → UI`

という流れであれば、その順番にコードを追いながらmicrotaskを作る。
コード構造上の都合だけで、後段の型・クラス・メソッドを先に実装しない。

たとえば、

`caller → service → repository`

というデータフローで、caller側から新しい値を渡す必要がある場合は、

1. callerから値を渡す
2. serviceにその引数を追加する
3. serviceからrepositoryへ値を渡す
4. repositoryにその引数を追加する

のような順序を許可する。

この結果、一時的にコンパイルエラーが発生してもよい。

# 変更差分を提示する

ユーザーがmicrotaskを選ぶ前に、**そのmicrotaskを実装するとコードがどのように変わるか判断できる状態**にする。

各microtaskについて、その変更だけを表す必要最小限のdiffを提示する。

diffには、

- 変更される行
- 変更を理解するために必要な最小限の周辺コード

だけを含める。

ファイル全体や、判断に不要な長いコードは表示しない。

各diffは、そのmicrotaskより前の候補が順番に適用された仮想状態を基準にしてよい。

たとえば、

1. `submit` に `inputText` 引数を追加する
2. `repository.search` に `inputText` を渡す

という順序なら、2のdiffでは1が適用済みとして扱う。
ただし、これは候補を判断するための仮想的な変更イメージである。

ユーザーが一部のmicrotaskだけを選択した場合、`mini-impl` はこの仮想状態を前提にせず、実際の現在コードを読み直して実装する。

後続microtaskの変更を先取りしてdiffへ含めない。

# 手順

## 1. 実装したい最終状態を把握する

ユーザーの要求から、

- 何がきっかけで処理が始まるか
- どのデータが流れるか
- どこを通るか
- 最終的に何が起こるか

を把握する。

要求に複数のシナリオが含まれる場合は、まず主要シナリオを優先する。

無関係なシナリオを1回の候補一覧に混ぜすぎない。

## 2. 現在状態を確認する

妥当なmicrotaskを作るために必要な範囲でコードを読む。

ここは省略しない。

確認するもの:

- 現在の責務分割
- 対象シナリオの入口
- データ・制御の流れ
- 利用できる既存API
- 関連する型やinterface
- 関連テスト
- プロジェクトルール
- すでに実装済みの部分
- microtaskで実際に編集することになる箇所

過去に提示したmicrotaskではなく、**現在のコードを正とする**。

前回候補に含まれていても、すでに実装済みなら再提示しない。

## 3. シナリオを1本定める

現在進める主要なシナリオを、入口から出口まで短く捉える。

例:

`ボタン押下 → ViewModel → Repository → API → レスポンス解析 → ViewModel → 表示`

この順序をmicrotaskの並び順の基準とする。
シナリオそのものを詳細な設計書として出力する必要はない。

## 4. 現在地点を特定する

シナリオを先頭から追い、

**どこまで実装済みで、次にどこを変更すればよいか**

を判断する。

すでに通過済みの部分を再実装しない。

## 5. microtask候補を生成する

現在地点からシナリオを先へ進めるmicrotaskを最大10件作る。

候補は、

- 現在地点に最も近い変更
- そこからシナリオを先へ進める近い変更

を中心とする。

最終状態までの全microtaskを列挙する必要はない。

10件より少ない方が自然なら、無理に10件作らない。

## 6. 各microtaskの差分を作る

生成したmicrotaskごとに、実際の現在コードを確認し、そのmicrotaskを適用した場合の最小差分を作る。

推測だけでdiffを作らない。

各diffは、原則としてそれ以前の候補が順番に適用された仮想状態を基準にする。

ただし、各diffに含める変更は、そのmicrotask自身の変更だけにする。

## 7. 番号ごとに提示する

各microtaskを独立した判断単位として、

- 番号
- 変更内容
- ファイル名
- diff

の順で提示する。

ファイル名は補助情報として目立たせない。

ユーザーが各番号のdiffを見て、そのまま実装する番号を選べる状態にする。

# 避けること

以下は行わない。

- 最終状態までの完全な実装計画を作る
- microtaskを機能単位まで大きくまとめる
- コンパイルを維持するためだけに順序を入れ替える
- 後段の実装を先回りする
- 関係のないリファクタリングを候補に入れる
- 将来のためだけの抽象化を入れる
- 不要な汎用化を行う
- 過剰なエラーハンドリングを入れる
- テスト追加だけを独立したmicrotaskとして大量に並べる
- 「実装する」「対応する」だけで具体的変更が分からない候補を出す
- 同じ変更を異なる言い方で重複して提示する
- 判断に不要な大量のコードをdiffに含める
- ファイル全体のdiffを表示する
- 現在のコードを確認せず、想像だけでdiffを作る
- 1つのdiffに複数microtask分の変更を含める
- コンパイルを通すためだけの変更をdiffに含める

# テストの扱い

テストを実装から完全に分離した工程として扱わない。
ある振る舞いを追加するとき、そのmicrotaskと一緒に変更するのが自然な小さなテストであれば含めてもよい。
ただし、テスト追加によってmicrotaskが大きくなる場合は先取りしない。

数microtask進み、意味のある振る舞いが成立した時点で検証する方が自然なら、その段階まで待つ。

# 出力
出力先は`.ai/mini`ディレクトリ以下に適当なファイル名で保存する。
最初に、今回追うシナリオを1行だけ示す。

例:

> シナリオ: ボタン押下 → ViewModel → Repository → API → 結果表示

その後、microtaskを番号順に提示する。

各microtaskは、

- 番号
- 変更内容
- 必要最小限のdiff
- 必要であればファイル名

だけを表示する。

ファイル名は変更内容より目立たせず、補助情報としてdiffの直前に記載する。

例:

### 1. `submit` に `inputText: string` 引数を追加する

`src/search/SearchViewModel.ts`

```diff
- async submit() {
+ async submit(inputText: string) {
    await this.repository.search();
}
```

### 2. `repository.search()` に `inputText` を渡す

`src/search/SearchViewModel.ts`

```diff
async submit(inputText: string) {
-   await this.repository.search();
+   await this.repository.search(inputText);
}
```

※ Repository側を変更するまで一時的に型エラーになる。

### 3. `search` に `query: string` 引数を追加する

`src/search/SearchRepository.ts`

```diff
- async search(): Promise<SearchResult> {
+ async search(query: string): Promise<SearchResult> {
    return this.client.get("/search");
}
```

### 4. HTTPクライアントへ `query` を渡す

`src/search/SearchRepository.ts`

```diff
async search(query: string): Promise<SearchResult> {
-   return this.client.get("/search");
+   return this.client.get("/search", query);
}
```

### 5. HTTPレスポンスを変数で受け取る

`src/search/SearchRepository.ts`

```diff
async search(query: string): Promise<SearchResult> {
-   return this.client.get("/search", query);
+   const response = await this.client.get("/search", query);
+   return response;
}
```

### 6. `response.body` を `parseResponse` に渡す

`src/search/SearchRepository.ts`

```diff
async search(query: string): Promise<SearchResult> {
    const response = await this.client.get("/search", query);
-   return response;
+   return parseResponse(response.body);
}
```

※ `parseResponse` を追加するまで一時的に未定義になる。

### 7. `parseResponse` のプレースホルダを追加する

`src/search/SearchRepository.ts`

```diff
+ function parseResponse() {
+ }
+
export class SearchRepository {
```

### 8. `parseResponse` に `body: string` 引数を追加する

`src/search/SearchRepository.ts`

```diff
- function parseResponse() {
+ function parseResponse(body: string) {
}
```

### 9. `parseResponse` の戻り値型を `SearchResult` にする

`src/search/SearchRepository.ts`

```diff
- function parseResponse(body: string) {
+ function parseResponse(body: string): SearchResult {
}
```

### 10. `SearchResult` 型のプレースホルダを追加する

`src/search/SearchResult.ts`

```diff
+ export interface SearchResult {
+ }
```

各diffは、そのmicrotaskによる変更だけを含める。

変更判断に不要な周辺コードは表示しない。

候補はデータ・制御フローに沿った連続した実装手順として提示するため、各diffは原則として、それ以前の候補が順番に適用された仮想状態を基準にする。

ユーザーが一部のmicrotaskだけを選択した場合、`mini-impl` はこの仮想状態を前提にせず、実際の現在コードを読み直して、選択されたmicrotaskだけを実装する。

以下は表示しない。

- 各候補の詳細な理由
- 完成後の設計説明
- ファイル全体のdiff