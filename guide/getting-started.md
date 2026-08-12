---
title: 快速开始 | 入门指南
---

# 快速开始

## 环境要求

- PHP `^8.5`
- Laravel Framework `^13.0`
- PHP 扩展：
  - `ext-redis`
  - `ext-openssl`

## 安装

Pin 适用于已有的 Laravel 应用。

未创建 Laravel 应用时，可参考 [Laravel 官方安装文档](https://laravel.com/docs/13.x/installation) 创建项目：

```bash
laravel new example-app
cd example-app
```

安装 Pin：

```bash
composer require ipiner/pin
```

::: tip

如果项目需要测试、静态分析或 API 文档生成，可安装以下开发依赖：

```bash
composer require --dev pestphp/pest phpstan/phpstan dedoc/scramble
```

首次使用 Pest，需要初始化测试配置：

```bash
./vendor/bin/pest --init
```

:::

## 集成 Pin

Pin 提供 `Pin\Application` 类，用于简化 Laravel 应用初始化流程，并支持配置递归合并。

修改 `bootstrap/app.php`：

```php
<?php

use Pin\Application;

return Application::configure(dirname(__DIR__))
    ->create();

```

## 验证集成

启动应用后，访问：

```text
http://yourdomain/api/debug/routes
```

如果返回已注册路由信息，说明 Pin 已成功集成。

::: tip
`api/debug/routes` 由 `Pin\Debug\DebugRoute` 提供。

出于安全考虑，所有 `api/debug/*` 调试路由仅在非生产环境启用。
:::

## 示例项目

[https://github.com/ipiner/admin](https://github.com/ipiner/admin)

该项目是一个基于 Pin 开发的极简后台管理系统 API 示例，展示 Pin 在实际项目中的应用：

- [路由枚举](/features/routing)：使用枚举定义路由，并贯穿路由注册、URL 生成与 HTTP 测试。
- [Action（操作）](/features/action)：使用 Action 组织业务流程，保持业务逻辑清晰、独立且易于测试。
- [查询构建](/model/queryable)：基于验证规则声明查询能力，并转换为 Eloquent 查询条件。
- [统一响应](/features/response)：使用标准化响应结构，保持接口返回格式一致。
- [错误码](/features/errors)：使用枚举定义错误码，统一 API 错误规范。
- [HTTP 测试](/testing/http-tests)：基于路由枚举构建测试请求，保持接口测试与路由定义一致。
- [API 文档](/digging-deeper/scramble)：根据代码结构和类型生成接口文档，保持文档与代码同步。
