# Deploy Button 实测记录

这份记录只保存当前公开入口的实测结论。每次修改 `wrangler.jsonc`、部署脚本、D1/R2 binding 或 README 部署入口后，都应该更新这份文档。

## 测试入口

[Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https://github.com/realchendahuang/FlareMo)

## 当前结论

- 状态：创建页实测通过，完整部署被 Git provider 连接挡住
- 复测日期：2026-06-28
- 测试入口：Chrome 登录态打开公开 Deploy Button URL
- 结果：Cloudflare 正确进入 Workers `deploy-to-workers` 创建流程，并在 Dashboard URL 中携带 FlareMo 仓库地址。

已确认的跳转目标：

```text
https://dash.cloudflare.com/?to=/%3Aaccount/workers-and-pages/create/deploy-to-workers&repository=https%3A%2F%2Fgithub.com%2Frealchendahuang%2FFlareMo
```

Chrome 登录态下的实际创建页目标：

```text
https://dash.cloudflare.com/<account>/workers-and-pages/create/deploy-to-workers?repository=https%3A%2F%2Fgithub.com%2Frealchendahuang%2FFlareMo
```

创建页已经确认能从仓库配置中解析：

- 项目名称：`flaremo`
- D1 binding：`DB`
- D1 默认资源：`flaremo`
- R2 binding：`ATTACHMENTS`
- R2 默认资源：`flaremo-attachments`
- 环境变量：`FLAREMO_SINGLE_USER_EMAIL`、`FLAREMO_SINGLE_USER_NAME`
- 构建命令：`pnpm run build`
- 部署命令：`pnpm run deploy`

为避免误连现有生产资源，本次测试把表单切换为独立测试资源：

- 项目名称：`flaremo-deploy-button-test-20260628`
- D1：选择 `+ 新建`，数据库名 `flaremo-deploy-button-test-db`
- R2：选择 `+ 新建`，bucket 名 `flaremo-deploy-button-test-attachments`

点击部署时 Cloudflare 返回表单错误：

```text
Connect a Git account to continue.
```

也就是说，FlareMo 的 Deploy Button、仓库解析和 Cloudflare 资源表单映射已验证；完整 Workers Builds 部署还需要在 Cloudflare Dashboard 里连接 GitHub/GitLab provider。这个 OAuth 授权会改变 Cloudflare 账号和 Git provider 的连接状态，未在本次自动化里静默执行。

完整新账号路径继续跟踪在 [issue #1](https://github.com/realchendahuang/FlareMo/issues/1)。

## 验收标准

- Cloudflare 能打开 Deploy Button 页面并识别 FlareMo 仓库。
- Cloudflare 能读取 Workers 项目配置。
- D1 database 和 R2 bucket 绑定能被部署流程识别。
- 部署完成后可以执行远端 D1 migrations。
- 生产访问由 Cloudflare Access 接管，FlareMo 不要求应用内 Bearer token。

## 部署后仍需人工确认

- Cloudflare Access application 和 policy 是否按自己的域名配置。
- 公开分享路径是否配置 bypass policy。
- 自定义域名、DNS 和证书是否完成。
- 首次导入真实数据前是否做过备份恢复演练。
