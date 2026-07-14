# 阿紫与阿虎

交互式绘本故事站：循序展开 10 个场景，文字默认隐藏、点击后逐行浮现。

## 本地预览

```bash
cd /Users/jiangjiwei/Code/Projects/azi-ahu-story
npx wrangler dev
```

## 部署

两处同步发布，共用 `public/` 目录与同一份 R2 图片资源。

### Cloudflare（主站，自定义域名）

```bash
npx wrangler deploy
```

- 站点：https://azi-ahu.flyooo.uk

### GitHub Pages（镜像站，自动部署）

- 推送到 `main` 后由 `.github/workflows/deploy-pages.yml` 自动构建发布
- 站点：https://cherrylover.github.io/azi-ahu-story/

- 图片：Cloudflare R2 `s3-hono` → 公开域名 `https://s3-store.flyooo.uk/story/azi-ahu/`

## 交互

- 序章自动浮现短句 →「进入故事」
- 每幕大图 + 标题；点「展开叙述」或空格逐行出字
- 展开完后可「下一幕」；顶栏圆点可跳转
- 键盘 ← → 翻页；点击图片放大
