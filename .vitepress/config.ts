import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "Pin",
  titleTemplate: "Pin - 轻量级 Laravel API 开发基座",

  description: "轻量级 Laravel API 开发基座",
  cleanUrls: true,
  // lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-5LT7X9Q717",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-5LT7X9Q717');`,
    ],
  ],
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    sidebar: [
      {
        collapsed: true,
        text: "入门指南",
        items: [
          { text: "快速开始", link: "/guide/getting-started" },
          { text: "配置", link: "/guide/configuration" },
          { text: "模块与推导", link: "/guide/module" },
        ],
      },
      {
        collapsed: true,
        text: "核心功能",
        items: [
          { text: "路由", link: "/features/routing" },
          { text: "控制器", link: "/features/controller" },
          { text: "Action（操作）", link: "/features/action" },
          { text: "请求", link: "/features/request" },
          { text: "响应", link: "/features/response" },
          { text: "验证", link: "/features/validation" },
          { text: "错误码", link: "/features/errors" },
          { text: "异常处理", link: "/features/exception-handler" },
          { text: "日志", link: "/features/logging" },
        ],
      },
      {
        collapsed: true,
        text: "继续深入",
        items: [
          { text: "缓存", link: "/digging-deeper/cache" },
          { text: "命令", link: "/digging-deeper/console" },
          { text: "ID 生成", link: "/digging-deeper/id-generate" },
          { text: "Tree（树）", link: "/digging-deeper/tree" },
          { text: "支撑工具", link: "/digging-deeper/support" },
          // { text: "接口文档生成", link: "/digging-deeper/scramble" },
        ],
      },
      {
        collapsed: true,
        text: "模型",
        link: "/model",
        items: [
          { text: "查询构建", link: "/model/queryable" },
          { text: "模型缓存", link: "/model/cache" },
          { text: "模型服务", link: "/model/service" },
        ],
      },
      {
        collapsed: true,
        text: "数据库",
        items: [
          { text: "连接配置", link: "/database/connection" },
          { text: "SQL 监控", link: "/database/query-monitor" },
          { text: "数据库迁移", link: "/database/migration" },
          { text: "Schema Metadata", link: "/database/schema-metadata" },
          { text: "Seeder 自动发现", link: "/database/seeder" },
        ],
      },
      {
        collapsed: true,
        text: "安全",
        items: [
          { text: "认证", link: "/security/authentication" },
          { text: "加解密", link: "/security/crypt" },
          { text: "密码", link: "/security/password" },
          { text: "Token（令牌）", link: "/security/token" },
        ],
      },
      {
        collapsed: true,
        text: "测试",
        items: [
          { text: "Fake 数据", link: "/testing/fake" },
          { text: "HTTP 测试", link: "/testing/http-tests" },
          { text: "辅助工具", link: "/testing/helpers" },
        ],
      },
      {
        collapsed: true,
        text: "扩展包",
        items: [
          { text: "访问控制", link: "/packages/access" },
          { text: "日志模块", link: "/packages/log" },
          { text: "验证码", link: "/packages/captcha" },
          { text: "文件上传", link: "/packages/upload" },
        ],
      },
    ],
    footer: {
      message: "基于 MIT 许可发布",
      copyright: "版权所有 © 2026 Pin",
    },
    logo: {
      src: "/logo.svg",
      alt: "Pin",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/ipiner/pin" }],
    siteTitle: "Pin",
    search: {
      provider: "local",
    },
    nav: [
      { text: "指南", link: "/guide/getting-started" },
      { text: "功能", link: "/features/routing" },
      // { text: "参考", link: "/reference/config" },
    ],
    outline: {
      label: "页面导航",
      level: [2, 3],
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    lastUpdated: {
      text: "最后更新",
      formatOptions: {
        dateStyle: "medium",
        timeStyle: "short",
      },
    },
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
  },
});
