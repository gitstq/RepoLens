<div align="center">

# 🔍 RepoLens

**Lightweight Git Repository Multi-dimensional Intelligent Analysis Engine**
**轻量级 Git 仓库多维智能分析引擎**

[![npm version](https://img.shields.io/npm/v/repolens?color=blue&style=flat-square)](https://www.npmjs.com/package/repolens)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-orange?style=flat-square)]()

**[English](#english) · [简体中文](#简体中文) · [繁體中文](#繁體中文)**

<p>
<img src="https://img.shields.io/badge/Health_Score-6_Dimensions-blue" />
<img src="https://img.shields.io/badge/Complexity-Analysis-red" />
<img src="https://img.shields.io/badge/Contributors-Profiling-purple" />
<img src="https://img.shields.io/badge/Architecture-Dependency_Graph-yellow" />
<img src="https://img.shields.io/badge/Changelog-Auto_Generate-green" />
</p>

</div>

---

## 简体中文

### 🎉 项目介绍

RepoLens 是一款**零外部依赖**的轻量级 Git 仓库多维智能分析引擎，使用纯 TypeScript 编写。它能从**健康度评分、代码复杂度、贡献者画像、架构依赖、变更日志**五大维度深度剖析任何 Git 仓库，帮助开发者全面了解项目状态、发现潜在问题、优化代码质量。

**灵感来源**：在 GitHub Trending 上观察到大量代码分析类工具（如 graphify、compound-engineering-plugin）的爆发式增长，开发者对仓库深度分析的需求日益强烈。然而现有工具要么过于笨重（需要数据库），要么功能单一，缺乏一个轻量、全面、零配置的分析方案。

**自研差异化亮点**：
- 🚀 **零外部运行时依赖** — 仅使用 Node.js 内置模块，安装即用
- 📊 **6维度健康度评分** — 代码质量、提交活跃度、依赖安全、文档覆盖、测试覆盖、社区活跃度
- 🔥 **热点文件检测** — 自动识别高复杂度且频繁修改的"问题文件"
- 🏗️ **循环依赖检测** — 发现模块间的循环引用，提升架构质量
- 📋 **智能变更日志** — 从 Git 历史自动生成 Conventional Commits 格式的 CHANGELOG
- 📤 **多格式输出** — 支持 JSON / Markdown / HTML（含可视化图表）
- 🖥️ **跨平台兼容** — Windows / macOS / Linux 全平台支持

---

### ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🏥 **健康度评分** | 6维度加权评分（A/B/C/D等级），全面量化仓库质量 |
| 🧮 **代码复杂度分析** | 圈复杂度估算、文件排名、热点文件识别、重构建议 |
| 👥 **贡献者画像** | 提交排行、角色分类（核心/活跃/偶尔）、协作网络分析 |
| 🏗️ **架构依赖分析** | 模块依赖图、循环依赖检测、耦合度计算 |
| 📋 **智能变更日志** | 自动分类 feat/fix/docs/refactor，生成标准 CHANGELOG |
| 🔄 **多仓库对比** | 并排对比两个仓库的各维度指标 |
| 🎨 **彩色终端输出** | 美观的 ASCII Logo、进度条、评分徽章 |
| 📄 **HTML 可视化报告** | 深色主题、内联 CSS、独立可分享的 HTML 文件 |

---

### 🚀 快速开始

#### 环境要求

- **Node.js** >= 18.0.0
- **Git** >= 2.0.0
- **npm** >= 8.0.0

#### 安装

```bash
# 从源码安装
git clone https://github.com/gitstq/RepoLens.git
cd RepoLens
npm install
npm run build
npm link

# 或者全局安装（发布后）
npm install -g repolens
```

#### 基本使用

```bash
# 分析当前目录的仓库
repolens analyze .

# 分析指定路径的仓库
repolens analyze ./my-project

# 生成 HTML 报告
repolens analyze ./my-project --format html --output report.html

# 生成 JSON 数据（便于程序处理）
repolens analyze ./my-project --format json --output result.json

# 对比两个仓库
repolens compare ./project-a ./project-b

# 生成变更日志
repolens changelog ./my-project --format markdown --output CHANGELOG.md
```

#### 命令行参数

```
USAGE
  repolens <command> [options] [paths...]

COMMANDS
  analyze   <path>              分析单个仓库
  compare   <path1> <path2>      对比两个仓库
  changelog <path>              从 Git 历史生成变更日志

OPTIONS
  -f, --format <format>         输出格式: json, markdown, html (默认: markdown)
  -o, --output <file>           输出到文件而非终端
  -v, --verbose                 显示详细进度信息
  --no-color                     禁用彩色输出
  -h, --help                     显示帮助信息
  -V, --version                  显示版本号
```

---

### 📖 详细使用指南

#### 健康度评分详解

RepoLens 从 6 个维度对仓库进行评分（每项 0-100 分）：

| 维度 | 权重 | 评估内容 |
|------|------|----------|
| 📝 **代码质量** | 20% | 文件大小分布、注释比例、命名规范 |
| 📈 **提交活跃度** | 20% | 提交频率、最近提交时间、提交趋势 |
| 🔒 **依赖安全** | 15% | 依赖文件完整性、锁文件存在性 |
| 📚 **文档覆盖** | 15% | README、LICENSE、CONTRIBUTING 等文件 |
| 🧪 **测试覆盖** | 15% | 测试目录存在性、测试文件比例 |
| 👥 **社区活跃度** | 15% | 贡献者数量、Issue/PR 模板 |

**评分等级**：🟢 A (90+) · 🔵 B (75+) · 🟡 C (60+) · 🔴 D (<60)

#### 典型使用场景

```bash
# 场景1：评估新开源项目的质量
repolens analyze ./awesome-project --format html --output audit.html

# 场景2：定期检查自己项目的健康状态
repolens analyze . --format json | jq '.health.totalScore'

# 场景3：识别需要重构的"热点文件"
repolens analyze . --verbose | grep "Hot File"

# 场景4：对比两个竞品项目的架构差异
repolens compare ./my-project ./competitor --format markdown

# 场景5：自动生成项目变更日志
repolens changelog . --format markdown --output CHANGELOG.md
```

#### 输出示例

**终端输出**：
```
  ╦ ╦┌─┐┬  ┬┌─┐┌┐ ╔╗╔╔═╗╦ ╦
  ║║║├┤ └┐┌┘├┤ ├┴┐║║║║ ║║║║
  ╚╩╝└─┘ └┘ └─┘└─┘╚╝╚╚═╝╚╩╝

  Analyzing: my-project

[1/4] Analyzing repository health...
  Overall Score:  78/100 (B)
[2/4] Analyzing code complexity...
  Files: 45  Lines: 12890  Avg Complexity: 28
[3/4] Analyzing contributors...
  Contributors: 12  Core: 3
[4/4] Analyzing architecture...
  Modules: 8  Dependencies: 15  Cycles: 2
```

---

### 💡 设计思路与迭代规划

#### 设计理念

RepoLens 遵循 **"零配置、零依赖、开箱即用"** 的设计哲学：
- **零配置**：无需数据库、配置文件或环境变量，指向仓库路径即可分析
- **零依赖**：运行时仅使用 Node.js 内置模块，避免版本冲突和安全风险
- **多维度**：不局限于单一指标，提供全方位的仓库健康视角

#### 技术选型

- **TypeScript**：类型安全、IDE 友好、社区活跃
- **Node.js 内置模块**：fs、path、child_process、readline — 无需第三方包
- **Git CLI**：通过 child_process 调用 git 命令，兼容所有 Git 版本

#### 后续迭代计划

- [ ] 🔌 插件系统 — 支持自定义分析维度和输出格式
- [ ] 📊 历史趋势 — 追踪仓库健康度随时间的变化
- [ ] 🌐 Web Dashboard — 本地 Web 界面实时查看分析结果
- [ ] 🔔 CI/CD 集成 — GitHub Action 自动分析 PR
- [ ] 📱 多语言报告 — 支持更多语言的输出模板

---

### 📦 打包与部署指南

#### 从源码构建

```bash
git clone https://github.com/gitstq/RepoLens.git
cd RepoLens
npm install
npm run build
```

#### 全局安装

```bash
npm link
# 现在可以在任何地方使用 repolens 命令
repolens analyze /path/to/any/repo
```

#### 兼容环境

| 环境 | 最低版本 | 状态 |
|------|----------|------|
| Node.js | 18.0+ | ✅ 完全支持 |
| macOS | 12+ | ✅ 完全支持 |
| Windows | 10+ | ✅ 完全支持 |
| Linux | Kernel 5.0+ | ✅ 完全支持 |

---

### 🤝 贡献指南

欢迎社区贡献！请遵循以下规范：

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交变更：`git commit -m "feat: add your feature description"`
4. 推送分支：`git push origin feat/your-feature`
5. 提交 **Pull Request**

**提交规范**（Angular Convention）：
- `feat:` 新增功能
- `fix:` 修复问题
- `docs:` 文档更新
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具变更

**Issue 反馈**：请使用 [GitHub Issues](https://github.com/gitstq/RepoLens/issues) 提交 Bug 报告或功能建议，附上复现步骤和环境信息。

---

### 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2026 RepoLens Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 繁體中文

### 🎉 專案介紹

RepoLens 是一款**零外部依賴**的輕量級 Git 倉庫多維智慧分析引擎，使用純 TypeScript 編寫。它能從**健康度評分、程式碼複雜度、貢獻者畫像、架構依賴、變更日誌**五大維度深度剖析任何 Git 倉庫，幫助開發者全面了解專案狀態、發現潛在問題、優化程式碼品質。

**靈感來源**：在 GitHub Trending 上觀察到大量程式碼分析類工具（如 graphify、compound-engineering-plugin）的爆發式增長，開發者對倉庫深度分析的需求日益強烈。然而現有工具要麼過於笨重（需要資料庫），要麼功能單一，缺乏一個輕量、全面、零配置的分析方案。

**自研差異化亮點**：
- 🚀 **零外部執行期依賴** — 僅使用 Node.js 內建模組，安裝即用
- 📊 **6維度健康度評分** — 程式碼品質、提交活躍度、依賴安全、文件覆蓋、測試覆蓋、社群活躍度
- 🔥 **熱點檔案偵測** — 自動識別高複雜度且頻繁修改的「問題檔案」
- 🏗️ **循環依賴偵測** — 發現模組間的循環引用，提升架構品質
- 📋 **智慧變更日誌** — 從 Git 歷史自動生成 Conventional Commits 格式的 CHANGELOG
- 📤 **多格式輸出** — 支援 JSON / Markdown / HTML（含視覺化圖表）
- 🖥️ **跨平台相容** — Windows / macOS / Linux 全平台支援

---

### ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🏥 **健康度評分** | 6維度加權評分（A/B/C/D等級），全面量化倉庫品質 |
| 🧮 **程式碼複雜度分析** | 圈複雜度估算、檔案排名、熱點檔案識別、重構建議 |
| 👥 **貢獻者畫像** | 提交排行、角色分類（核心/活躍/偶爾）、協作網路分析 |
| 🏗️ **架構依賴分析** | 模組依賴圖、循環依賴偵測、耦合度計算 |
| 📋 **智慧變更日誌** | 自動分類 feat/fix/docs/refactor，生成標準 CHANGELOG |
| 🔄 **多倉庫對比** | 並排對比兩個倉庫的各維度指標 |
| 🎨 **彩色終端輸出** | 美觀的 ASCII Logo、進度條、評分徽章 |
| 📄 **HTML 視覺化報告** | 深色主題、內嵌 CSS、獨立可分享的 HTML 檔案 |

---

### 🚀 快速開始

#### 環境需求

- **Node.js** >= 18.0.0
- **Git** >= 2.0.0
- **npm** >= 8.0.0

#### 安裝

```bash
# 從原始碼安裝
git clone https://github.com/gitstq/RepoLens.git
cd RepoLens
npm install
npm run build
npm link

# 或全域安裝（發佈後）
npm install -g repolens
```

#### 基本使用

```bash
# 分析目前目錄的倉庫
repolens analyze .

# 分析指定路徑的倉庫
repolens analyze ./my-project

# 生成 HTML 報告
repolens analyze ./my-project --format html --output report.html

# 生成 JSON 資料（便於程式處理）
repolens analyze ./my-project --format json --output result.json

# 對比兩個倉庫
repolens compare ./project-a ./project-b

# 生成變更日誌
repolens changelog ./my-project --format markdown --output CHANGELOG.md
```

#### 命令列參數

```
USAGE
  repolens <command> [options] [paths...]

COMMANDS
  analyze   <path>              分析單個倉庫
  compare   <path1> <path2>      對比兩個倉庫
  changelog <path>              從 Git 歷史生成變更日誌

OPTIONS
  -f, --format <format>         輸出格式: json, markdown, html (預設: markdown)
  -o, --output <file>           輸出到檔案而非終端
  -v, --verbose                 顯示詳細進度資訊
  --no-color                     停用彩色輸出
  -h, --help                     顯示說明資訊
  -V, --version                  顯示版本號
```

---

### 📖 詳細使用指南

#### 健康度評分詳解

RepoLens 從 6 個維度對倉庫進行評分（每項 0-100 分）：

| 維度 | 權重 | 評估內容 |
|------|------|----------|
| 📝 **程式碼品質** | 20% | 檔案大小分佈、註解比例、命名規範 |
| 📈 **提交活躍度** | 20% | 提交頻率、最近提交時間、提交趨勢 |
| 🔒 **依賴安全** | 15% | 依賴檔案完整性、鎖定檔案存在性 |
| 📚 **文件覆蓋** | 15% | README、LICENSE、CONTRIBUTING 等檔案 |
| 🧪 **測試覆蓋** | 15% | 測試目錄存在性、測試檔案比例 |
| 👥 **社群活躍度** | 15% | 貢獻者數量、Issue/PR 模板 |

**評分等級**：🟢 A (90+) · 🔵 B (75+) · 🟡 C (60+) · 🔴 D (<60)

#### 典型使用場景

```bash
# 場景1：評估新開源專案的品質
repolens analyze ./awesome-project --format html --output audit.html

# 場景2：定期檢查自己專案的健康狀態
repolens analyze . --format json | jq '.health.totalScore'

# 場景3：識別需要重構的「熱點檔案」
repolens analyze . --verbose | grep "Hot File"

# 場景4：對比兩個競品專案的架構差異
repolens compare ./my-project ./competitor --format markdown

# 場景5：自動生成專案變更日誌
repolens changelog . --format markdown --output CHANGELOG.md
```

---

### 💡 設計思路與迭代規劃

#### 設計理念

RepoLens 遵循 **「零配置、零依賴、開箱即用」** 的設計哲學：
- **零配置**：無需資料庫、設定檔或環境變數，指向倉庫路徑即可分析
- **零依賴**：執行期僅使用 Node.js 內建模組，避免版本衝突和安全風險
- **多維度**：不限於單一指標，提供全方位的倉庫健康視角

#### 技術選型

- **TypeScript**：型別安全、IDE 友好、社群活躍
- **Node.js 內建模組**：fs、path、child_process、readline — 無需第三方套件
- **Git CLI**：透過 child_process 呼叫 git 命令，相容所有 Git 版本

#### 後續迭代計畫

- [ ] 🔌 外掛系統 — 支援自訂分析維度和輸出格式
- [ ] 📊 歷史趨勢 — 追蹤倉庫健康度隨時間的變化
- [ ] 🌐 Web Dashboard — 本地 Web 介面即時查看分析結果
- [ ] 🔔 CI/CD 整合 — GitHub Action 自動分析 PR
- [ ] 📱 多語言報告 — 支援更多語言的輸出模板

---

### 📦 打包與部署指南

#### 從原始碼建構

```bash
git clone https://github.com/gitstq/RepoLens.git
cd RepoLens
npm install
npm run build
```

#### 全域安裝

```bash
npm link
# 現在可以在任何地方使用 repolens 命令
repolens analyze /path/to/any/repo
```

#### 相容環境

| 環境 | 最低版本 | 狀態 |
|------|----------|------|
| Node.js | 18.0+ | ✅ 完全支援 |
| macOS | 12+ | ✅ 完全支援 |
| Windows | 10+ | ✅ 完全支援 |
| Linux | Kernel 5.0+ | ✅ 完全支援 |

---

### 🤝 貢獻指南

歡迎社群貢獻！請遵循以下規範：

1. **Fork** 本倉庫
2. 建立功能分支：`git checkout -b feat/your-feature`
3. 提交變更：`git commit -m "feat: add your feature description"`
4. 推送分支：`git push origin feat/your-feature`
5. 提交 **Pull Request**

**提交規範**（Angular Convention）：
- `feat:` 新增功能
- `fix:` 修復問題
- `docs:` 文件更新
- `refactor:` 程式碼重構
- `test:` 測試相關
- `chore:` 建構/工具變更

**Issue 回饋**：請使用 [GitHub Issues](https://github.com/gitstq/RepoLens/issues) 提交 Bug 報告或功能建議，附上重現步驟和環境資訊。

---

### 📄 開源協議

本專案基於 [MIT License](LICENSE) 開源。

---

## English

### 🎉 Introduction

RepoLens is a **zero-dependency** lightweight Git repository multi-dimensional intelligent analysis engine written in pure TypeScript. It provides in-depth analysis of any Git repository across **five major dimensions**: health scoring, code complexity, contributor profiling, architecture dependencies, and changelog generation — empowering developers to fully understand project status, discover potential issues, and optimize code quality.

**Inspiration**: Observing the explosive growth of code analysis tools on GitHub Trending (such as graphify, compound-engineering-plugin), the developer community's demand for deep repository analysis has never been stronger. However, existing tools are either too heavy (requiring databases) or too narrow in scope, lacking a lightweight, comprehensive, zero-configuration analysis solution.

**Differentiated Highlights**:
- 🚀 **Zero runtime dependencies** — Uses only Node.js built-in modules, install and run
- 📊 **6-dimension health scoring** — Code quality, commit activity, dependency safety, documentation coverage, test coverage, community activity
- 🔥 **Hot file detection** — Automatically identifies high-complexity, frequently-modified "problem files"
- 🏗️ **Circular dependency detection** — Discovers circular references between modules
- 📋 **Smart changelog generation** — Auto-generates Conventional Commits formatted CHANGELOG from Git history
- 📤 **Multi-format output** — JSON / Markdown / HTML (with visual charts)
- 🖥️ **Cross-platform** — Full support for Windows / macOS / Linux

---

### ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🏥 **Health Score** | 6-dimension weighted scoring (A/B/C/D grades) for comprehensive repository quality |
| 🧮 **Code Complexity** | Cyclomatic complexity estimation, file rankings, hot file detection, refactoring suggestions |
| 👥 **Contributor Profiling** | Commit rankings, role classification (core/active/occasional), collaboration network |
| 🏗️ **Architecture Analysis** | Module dependency graph, circular dependency detection, coupling metrics |
| 📋 **Smart Changelog** | Auto-classifies feat/fix/docs/refactor, generates standard CHANGELOG |
| 🔄 **Repository Comparison** | Side-by-side comparison of two repositories across all dimensions |
| 🎨 **Colored Terminal Output** | Beautiful ASCII logo, progress bars, score badges |
| 📄 **HTML Visual Reports** | Dark theme, inline CSS, standalone shareable HTML files |

---

### 🚀 Quick Start

#### Requirements

- **Node.js** >= 18.0.0
- **Git** >= 2.0.0
- **npm** >= 8.0.0

#### Installation

```bash
# Install from source
git clone https://github.com/gitstq/RepoLens.git
cd RepoLens
npm install
npm run build
npm link

# Or install globally (after publish)
npm install -g repolens
```

#### Basic Usage

```bash
# Analyze the repository in the current directory
repolens analyze .

# Analyze a repository at a specific path
repolens analyze ./my-project

# Generate an HTML report
repolens analyze ./my-project --format html --output report.html

# Generate JSON data (for programmatic processing)
repolens analyze ./my-project --format json --output result.json

# Compare two repositories
repolens compare ./project-a ./project-b

# Generate a changelog
repolens changelog ./my-project --format markdown --output CHANGELOG.md
```

#### CLI Options

```
USAGE
  repolens <command> [options] [paths...]

COMMANDS
  analyze   <path>              Analyze a single repository
  compare   <path1> <path2>      Compare two repositories
  changelog <path>              Generate changelog from Git history

OPTIONS
  -f, --format <format>         Output format: json, markdown, html (default: markdown)
  -o, --output <file>           Write output to file instead of stdout
  -v, --verbose                 Show detailed progress information
  --no-color                     Disable colored output
  -h, --help                     Show help information
  -V, --version                  Show version number
```

---

### 📖 Detailed Usage Guide

#### Health Score Breakdown

RepoLens scores repositories across 6 dimensions (0-100 points each):

| Dimension | Weight | What It Measures |
|-----------|--------|-------------------|
| 📝 **Code Quality** | 20% | File size distribution, comment ratio, naming conventions |
| 📈 **Commit Activity** | 20% | Commit frequency, recent activity, commit trends |
| 🔒 **Dependency Safety** | 15% | Dependency file completeness, lock file presence |
| 📚 **Documentation Coverage** | 15% | README, LICENSE, CONTRIBUTING files |
| 🧪 **Test Coverage** | 15% | Test directory presence, test file ratio |
| 👥 **Community Activity** | 15% | Contributor count, Issue/PR templates |

**Grade Scale**: 🟢 A (90+) · 🔵 B (75+) · 🟡 C (60+) · 🔴 D (<60)

#### Common Use Cases

```bash
# Evaluate a new open-source project's quality
repolens analyze ./awesome-project --format html --output audit.html

# Periodically check your project's health
repolens analyze . --format json | jq '.health.totalScore'

# Identify files that need refactoring
repolens analyze . --verbose | grep "Hot File"

# Compare architecture differences between competing projects
repolens compare ./my-project ./competitor --format markdown

# Auto-generate project changelog
repolens changelog . --format markdown --output CHANGELOG.md
```

---

### 💡 Design Philosophy & Roadmap

#### Design Principles

RepoLens follows the philosophy of **"zero configuration, zero dependencies, ready to use"**:
- **Zero Configuration**: No databases, config files, or environment variables needed — just point to a repo path
- **Zero Dependencies**: Runtime uses only Node.js built-in modules, avoiding version conflicts and security risks
- **Multi-dimensional**: Goes beyond single metrics to provide a comprehensive repository health perspective

#### Technology Choices

- **TypeScript**: Type safety, IDE-friendly, active community
- **Node.js Built-in Modules**: fs, path, child_process, readline — no third-party packages
- **Git CLI**: Invokes git commands via child_process for maximum Git version compatibility

#### Roadmap

- [ ] 🔌 Plugin System — Custom analysis dimensions and output formats
- [ ] 📊 Historical Trends — Track repository health changes over time
- [ ] 🌐 Web Dashboard — Local web interface for real-time analysis results
- [ ] 🔔 CI/CD Integration — GitHub Action for automatic PR analysis
- [ ] 📱 Multi-language Reports — Support for additional output language templates

---

### 📦 Build & Deployment

#### Build from Source

```bash
git clone https://github.com/gitstq/RepoLens.git
cd RepoLens
npm install
npm run build
```

#### Global Installation

```bash
npm link
# Now you can use repolens anywhere
repolens analyze /path/to/any/repo
```

#### Compatible Environments

| Environment | Minimum Version | Status |
|-------------|----------------|--------|
| Node.js | 18.0+ | ✅ Fully Supported |
| macOS | 12+ | ✅ Fully Supported |
| Windows | 10+ | ✅ Fully Supported |
| Linux | Kernel 5.0+ | ✅ Fully Supported |

---

### 🤝 Contributing

Community contributions are welcome! Please follow these guidelines:

1. **Fork** this repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature description"`
4. Push the branch: `git push origin feat/your-feature`
5. Submit a **Pull Request**

**Commit Convention** (Angular Convention):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `refactor:` Code refactoring
- `test:` Test-related changes
- `chore:` Build/tooling changes

**Issue Reporting**: Please use [GitHub Issues](https://github.com/gitstq/RepoLens/issues) to submit bug reports or feature requests with reproduction steps and environment details.

---

### 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by RepoLens Contributors**

**[⬆ Back to Top](#-repolens)**

</div>
