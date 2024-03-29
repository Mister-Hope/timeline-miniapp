# timeline-miniapp

一个简单时间线微信小程序，支持发布、浏览与分享。

## 构建代码

小程序使用 gulp 进行构建，请在克隆本项目后通过 pnpm, yarn 或 npm 安装依赖。

- 使用 `pnpm run build`, `yarn run build` 或 `npm run build` 编译小程序输出

- 使用 `pnpm run watch`,`yarn run watch` 或 `npm run watch` 在开发过程中监听小程序更改

- 使用 `pnpm run lint`, `yarn run lint` 或 `npm run lint` 格式化小程序代码

## 配置

小程序的配置文件在 `app/config.ts` 下，你可以修改该文件配置小程序的基础信息。

## 云开发

小程序后端使用云开发。为了让小程序正常工作，你需要:

1. 创建云开发环境

1. 在云开发环境的数据库中创建 `admin` 和 `items` 两个集合

1. 在构建小程序后，将 `dist/cloud` 下的文件夹依次上传至云开发 (在文件夹上右键选择 `上传并部署: 云端安装依赖`)

同时，你需要手动添加可以发布内容的人员，详细操作如下:

1. 使用相应人员的微信打开小程序或登陆开发者工具打开模拟器

1. 在日志中找到 `openid 为 xxxx 用户不是所有者`，并记录 openid 的值

1. 在开发者工具中打开云开发，在数据库中找到 admin 集合

1. 点击添加记录，保持 `使用系统自动生成的 ID` 选项，点击加号图标，添加一个类型为 `string` 的 openid 字段，并粘贴记录的值。
