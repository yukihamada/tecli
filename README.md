# TE (tecli) - Ultra-fast AI CLI powered by Groq

超高速 Groq Cloud を使用した AI コマンドラインツール

## インストール

### クイックインストール（推奨）

```bash
curl -sSL https://raw.githubusercontent.com/yukihamada/tecli/main/install.sh | bash
```

### 手動インストール

```bash
git clone https://github.com/yukihamada/tecli.git
cd tecli
npm install
npm run build
npm link
```

## セットアップ

1. [Groq Cloud](https://console.groq.com/) でAPIキーを取得
2. インストールスクリプトでAPIキーを入力するか、環境変数を設定：

```bash
export GROQ_API_KEY="your-api-key-here"
```

## 使い方

### インタラクティブチャット
```bash
te chat
```

### 単発質問
```bash
te ask "What is the capital of Japan?"
```

### Web検索（compound-betaモデル使用）
```bash
te search "latest news about AI"
```

### 利用可能なモデルを表示
```bash
te models
```

## 主な機能

- **超高速レスポンス**: Groq LPU で最大 18× 高速
- **ストリーミング対応**: リアルタイムレスポンス
- **Web検索**: compound-betaモデルで最新情報を取得
- **ツール実行**: ファイルシステム、シェル、検索
- **軽量**: 依存関係最小限

## 推奨モデル

| 用途 | モデル ID | 特徴 |
|------|-----------|------|
| 汎用 | llama-3.1-70b-versatile | 128k context |
| Web検索 | compound-beta | 組み込み検索機能 |
| 高速 | mixtral-8x7b-32768 | 600+ tok/s |
| 日本語 | gemma2-9b-it | 日英対応 |

## ライセンス

MIT