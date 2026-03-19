# MiniNav - 迷你导航

个人书签导航站，支持分组管理、拖拽排序、多主题切换、密码保护、云端同步。

## 功能特性

- **分组管理**：创建、编辑、删除、拖拽排序书签分组
- **书签管理**：添加、编辑、删除、跨组拖拽排序
- **三种主题**：日间 / 阅读 / 深夜模式
- **访问密码**：通过环境变量设置密码保护
- **云端同步**：使用 Vercel Blob 存储数据，多设备同步
- **JSON 导入导出**：支持简洁格式导入，自动生成 id 和 order
- **自定义图标**：支持为每个书签指定图标 URL
- **响应式布局**：移动端 1 列，平板 2 列，桌面 3-4 列
- **搜索过滤**：实时搜索书签
- **常用应用栏**：置顶书签快速访问

## 部署方式一：Vercel（推荐）

1. Fork 本仓库到你的 GitHub
2. 在 Vercel 导入项目，Framework 选 Next.js
3. 在 Vercel Dashboard → Storage → Create Store → Blob，创建 Blob 存储（自动注入 `BLOB_READ_WRITE_TOKEN`）
4. 在 Settings → Environment Variables 添加 `NAV_PASSWORD`（你的访问密码）
5. 点击 Deploy，绑定自定义域名
6. 访问域名，输入密码，开始使用

## 部署方式二：本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/homedb.git
cd homedb

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

**注意**：本地开发时如果没有配置 `BLOB_READ_WRITE_TOKEN`，数据将仅保存在 localStorage，不会同步到云端。

## JSON 导入格式（最简）

```json
{
  "groups": [
    {
      "name": "分组名称",
      "bookmarks": [
        { "name": "站点名", "url": "https://example.com" },
        { "name": "带图标", "url": "https://example.com", "icon": "https://icon-url.png" }
      ]
    }
  ]
}
```

- `id`、`order`、`color` 等字段可省略，导入时自动生成
- `icon` 字段可选，留空则自动获取网站 favicon

## 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 存储令牌（创建 Blob Store 后自动注入） | 否（无则仅本地存储） |
| `NAV_PASSWORD` | 访问密码（留空则不需要密码） | 否 |

## 技术栈

- [Next.js](https://nextjs.org) - React 框架
- [React](https://react.dev) - UI 库
- [TypeScript](https://typescriptlang.org) - 类型安全
- [Tailwind CSS](https://tailwindcss.com) - 原子化 CSS
- [shadcn/ui](https://ui.shadcn.com) - UI 组件
- [@dnd-kit](https://dndkit.com) - 拖拽排序
- [Vercel Blob](https://vercel.com/storage/blob) - 云端存储

## 相关链接

- [v0 项目](https://v0.app/chat/projects/prj_v0fbhZpp9ZHG4f6UAGaaNkxHzWjj) - 继续在 v0 上开发
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js
- [v0 文档](https://v0.app/docs) - 了解 v0

<a href="https://v0.app/chat/api/kiro/clone/gaodui409/homedb" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
