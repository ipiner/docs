---
title: 认证 | 安全
---

# 认证

Pin 认证基于 Laravel 认证体系，为 API 应用提供基于 Token 的身份认证方式。

## 配置

Pin 认证使用 Laravel Guard 进行管理。

在 `config/auth.php` 中，将默认 guard 设置为 `Guard::NAME`：

```php
// config/auth.php

use Pin\Auth\Guard;

return [
    'defaults' => [
        'guard' => Guard::NAME,
        'passwords' => 'users',
    ],
];
```

配置后，可通过 Laravel 标准认证入口获取当前用户：

```php
$user = auth()->user();
```

如果应用配置了多个认证 Guard，可以显式指定 Pin Guard：

```php
use Pin\Auth\Guard;

$user = auth(Guard::NAME)->user();
```

## Token

Pin 认证提供统一的 Token 入口：

```php
use Pin\Auth\Auth;

$token = Auth::token();
```

更多内容请参考 [Token](/security/token)。

### 创建 Token

用户登录成功后，可以创建 Token 并返回给客户端：

```php
use Pin\Auth\Auth;

$token = Auth::token()->encode([
    'uid' => $user->id,
    'jti' => sprintf('auth-token:%d-%s', $user->id, uniqid()),
]);
```

### 注销登录

退出登录时，可以使用 Laravel 标准注销方法：

```php
auth()->logout();
```

### 获取 Token

Pin 认证会按照以下顺序从请求中读取 Token：

1. `Authorization: Bearer <token>`
2. `token` Header
3. `token` Query 参数

推荐使用标准 Bearer Token：

```http
Authorization: Bearer your-token
```

也可以通过 Header 传递：

```http
token: your-token
```

或通过 Query 参数传递：

```http
GET /api/user?token=your-token
```

## 控制台用户

在命令行、队列任务或计划任务等非 HTTP 场景中，应用没有来自请求的登录用户。

Pin 认证会提供一个控制台用户，业务代码仍然可以使用 Laravel 标准认证入口：

```php
auth()->user();
```

## 调试登录

非生产环境下，Pin 认证支持通过 Token 内容直接指定测试用户。

例如：

```http
Authorization: Bearer 1
```

或：

```http
Authorization: Bearer admin
```

系统会根据 Token 内容匹配用户，并作为当前认证用户。

::: warning
调试登录仅用于开发环境。

生产环境不会启用该功能。
:::

## Sanctum Token 兼容

如果请求中携带 Laravel Sanctum Token，Pin 认证不会处理该 Token。

这样可以让 Pin 认证与 Sanctum 等认证方案共存。
