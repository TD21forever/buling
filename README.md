# 捕灵 (Buling) - AI灵感捕捉工具

基于AI的对话式灵感捕捉与管理工具，帮助创作者、研究者和知识工作者记录、整理和发现创意灵感。

## ✨ 核心功能

### 🤖 对话式灵感捕捉
- **AI对话引导**: 智能提问，帮助用户深入思考
- **语音输入支持**: 长按说话，松手发送，解放双手
- **实时保存**: 对话过程中自动保存，防止丢失
- **智能摘要**: AI自动生成对话摘要
- **打断机制**: AI思考时用户可以打断并继续对话

### 🏷️ 智能分类与标签
- **自动分类**: 工作、生活、创作、学习四大类
- **智能标签**: 提取关键词作为标签
- **分类去重**: 避免重复分类，保持数据整洁
- **手动调整**: 支持用户手动修改分类和标签

### 📚 灵感库管理
- **卡片式展示**: 直观的灵感卡片布局
- **详情查看**: 完整的灵感内容展示
- **在线编辑**: 支持修改标题、摘要、分类、标签
- **安全删除**: 删除前确认，防止误操作
- **搜索过滤**: 支持按标题、内容、标签搜索

### 🔧 批量管理功能
- **多选模式**: 长按进入，支持选择多个灵感
- **批量分类**: 同时为多个灵感添加/移除分类
- **批量标签**: 同时为多个灵感添加/移除标签
- **批量删除**: 一次性删除多个灵感
- **批量导出**: 导出选中的灵感为Markdown/JSON/TXT文件

### 📱 PWA支持
- **离线使用**: 支持离线访问和基本功能
- **安装到主屏幕**: 支持Android和iOS设备
- **原生体验**: 类似原生应用的用户体验
- **自动更新**: 应用更新时自动推送

## 🛠️ 技术栈

- **前端框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS + Radix UI
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **AI服务**: 硅基流动 API (Qwen/QwQ-32B)
- **语音识别**: Web Speech API
- **PWA**: next-pwa
- **语言**: TypeScript

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env.local` 文件并配置以下环境变量：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Silicon Flow API Configuration
SILICON_FLOW_API_KEY=your_silicon_flow_api_key_here
SILICON_FLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
```

### 数据库设置
1. 创建Supabase项目
2. 在SQL编辑器中运行数据库迁移脚本
3. 配置行级安全策略(RLS)

### 启动开发服务器
```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本
```bash
npm run build
npm start
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── auth/              # 认证相关页面
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── ui/               # 通用UI组件
│   ├── ChatInterface.tsx # 聊天界面
│   ├── InspirationLibrary.tsx # 灵感库
│   └── VoiceInput.tsx    # 语音输入
├── lib/                  # 工具库和配置
│   ├── supabase/        # Supabase客户端
│   ├── types.ts         # TypeScript类型定义
│   └── utils.ts         # 工具函数
└── middleware.ts        # Next.js中间件
```

## 🔧 API 端点

### 聊天相关
- `POST /api/chat` - 发送消息到AI
- `POST /api/chat/stream` - 流式聊天
- `POST /api/chat-sessions` - 创建聊天会话

### 灵感管理
- `GET /api/inspirations` - 获取灵感列表
- `POST /api/inspirations` - 创建新灵感
- `PUT /api/inspirations/[id]` - 更新灵感
- `DELETE /api/inspirations/[id]` - 删除灵感

### 批量操作
- `POST /api/inspirations/batch` - 批量操作
- `GET /api/inspirations/tags` - 获取标签列表
- `GET /api/inspirations/categories` - 获取分类统计

### 智能分析
- `POST /api/inspiration/analyze` - 分析内容并提取灵感

## 🎨 设计特色

- **响应式设计**: 完美适配手机和电脑
- **开屏即对话**: 打开应用直接进入对话界面
- **语音按钮显著**: 大尺寸渐变背景，长按说话
- **简洁直观**: 界面简洁，操作直观
- **一致性**: 保持视觉和交互的一致性

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issues和Pull Requests！

## 📞 联系我们

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: support@buling.app

---

**捕灵 - 让灵感不再稍纵即逝** ✨
