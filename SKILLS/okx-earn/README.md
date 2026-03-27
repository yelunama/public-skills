# OKX Earn Skill — 开箱即用包

## 安装步骤

### 1. 安装 CLI 工具

```bash
cd okx-earn/cli
npm install -g .
okx --version   # 验证安装成功
```

### 2. 配置 API Key

```bash
mkdir -p ~/.okx
cat > ~/.okx/config.toml << 'TOML'
default_profile = "default"

[profiles.default]
api_key = "你的API_KEY"
secret_key = "你的SECRET_KEY"
passphrase = "你的PASSPHRASE"
TOML
```

### 3. 部署 Skill 到 OpenClaw

```bash
mkdir -p ~/.openclaw/skills/okx-earn
cp okx-earn/SKILL.md ~/.openclaw/skills/okx-earn/SKILL.md
```

### 4. 验证

```bash
# 公共接口（无需 API Key）
okx earn rate-summary USDT

# 私有接口（需要 API Key）
okx earn balance
```

## 包内文件

```
okx-earn/
├── SKILL.md      # OpenClaw 技能定义文件
├── README.md     # 本说明
└── cli/
    ├── index.js      # CLI 工具（含 earn 模块的完整 bundle）
    └── package.json  # npm 包描述
```
