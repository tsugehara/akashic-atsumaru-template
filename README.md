# Akashic Atsumaru Template

Akashic Engineのアツマール用テンプレートです。

以下の構成のゲームのみをサポートしています（色々やっつけなので是非PRを。。）。
- game: ゲーム一式が入っているディレクトリ
- html: akashic-export-htmlで出力されるディレクトリ

## 使い方

対象のゲームで、 `npm install akashic-atsumaru-template` をしてください。

そのゲームで、gameディレクトリの内容をhtmlディレクトリの内容に `akashic export html` （通常は、gameディレクトリで `akashic export html -o ../html` とかやると思います）で出力した後、 `akashic-atsumaru-template` を実行すると、htmlディレクトリの内容が書き換わってアツマールに投稿可能な形態になります。

この状態で、HTMLフォルダをZIP圧縮し、アツマールに投稿すれば、アツマールの各種機能が利用可能な形で使えるようになります。

## コンテンツの作り方

特に何もしなくても save と load は動作します。

それ以外に、コメント投稿等で連動を行いたい場合、 `game.external.atsumaru` を用いて、各種処理をゲーム側に実装してください。
