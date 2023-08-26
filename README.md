# 雪球用户自选股票列表更新监控

使用盯梢定时监控雪球用户自选股票列表，当列表发生变化时发送通知。

[脚本文档](https://docs.dingshao.cn/script/getting-started.html)

在 [src/script.ts](src/script.ts) 中可以将 `USER_ID` 修改为想要监控的用户 ID。比如用户页面的链接是 `https://xueqiu.com/u/3079173340`，那么对应的 `USER_ID` 就是 `3079173340`。

修改完成后，在盯梢手机应用创建对应的频道（建议命名为“xxx（雪球）自选股票更新”，方便其他用户搜索），并执行下方命令部署脚本。

```bash
npm install
npx dss deploy
```

## 安装依赖

```bash
npm install
```

## 本地测试

```bash
npx dss local-run
```

本地测试状态默认保存在 `.local` 文件夹中，可以使用参数 `--reset-state` 在本地运行时重置状态。

## 调试环境测试

```bash
# 部署到调试环境
npx dss deploy --debug
# 执行（不实际发送消息和更新状态）
npx dss run --dry-run

# 或者部署后直接执行
npx dss deploy --debug --dry-run
```

也可使用 `--run` 代替 `--dry-run`，此时即使是在调试环境（`--debug`）也会发送消息和更新状态。

## 调整定时执行

在正式部署前，请根据需要在 `package.json` 中调整定时执行计划，如 4 小时执行一次：

```json
{
  "dss": {
    "schedule": "rate(4h)"
  }
}
```

> 定时执行间隔不能低于 5 分钟。

> 调试环境定时执行不会生效。

## 部署到线上环境

```bash
# 部署
npx dss deploy
# 手动执行
npx dss run

# 或者部署后直接执行
npx dss deploy --run
```
