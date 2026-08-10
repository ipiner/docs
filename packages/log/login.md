---
title: 登录日志 | 日志模块 | 扩展包
---

# 登录日志

登录日志用于记录用户登录过程，包括登录结果、用户信息、请求信息以及上下文数据。

每条登录日志记录一次登录尝试，用于区分登录成功和失败情况。

## 数据结构

登录日志额外包含以下字段：

| 字段    | 类型         | 说明         |
| ------- | ------------ | ------------ |
| code    | int unsigned | 登录结果码   |
| message | varchar(255) | 登录结果信息 |
| context | json         | 上下文数据   |

## 创建登录日志

通过 `LoginPayload` 构建登录日志数据，并使用 `Log::create()` 写入日志。

登录成功：

```php
use Pin\Modules\Log\Facades\Log;
use Pin\Modules\Log\Payloads\LoginPayload;

$payload = new LoginPayload($user);

Log::create($payload);
```

登录失败：

```php
$payload = new LoginPayload(
    code: 10010,
    message: '帐号或密码错误',
)
  ->context([
    'error' => '帐号不存在'
  ]);

Log::create($payload);
```

## 内置路由

登录日志模块提供查询接口，用于查看登录日志及获取筛选项。

<p>
<a href="/images/login-log.png" target="_blank">
    <img src="/images/login-log.png" />
</a>
</p>

### 登录日志列表

`GET /api/system/log/logins` 用于分页查询登录日志，支持按业务对象、操作者、操作时间等条件筛选。

::: info
路由前缀 `/api/system/log` 可通过 `modules.log.routes.api_prefix` 配置。
:::

### 登录日志筛选项

`GET /api/system/log/logins/options` 用于获取登录日志查询所需的筛选条件。

## 附录

### 登录日志配置

`modules.log.login` 用于配置登录日志：

```php

use Pin\Modules\Log\Controllers\ActivityLogController;
use Pin\Modules\Log\Models\ActivityLog;

'login' => [
    'model' => ActivityLog::class,
    'controller' => ActivityLogController::class,
    'route_enabled' => true,
    'route_name' => 'system.log.logins',
],
```

| 配置项          | 说明                       |
| --------------- | -------------------------- |
| `model`         | 登录日志模型类，可按需覆盖 |
| `controller`    | 登录日志控制器，可按需覆盖 |
| `route_enabled` | 是否启用内置登录日志路由   |
| `route_name`    | 登录日志列表路由名称       |

::: info
关闭 `route_enabled` 后，仅禁用内置查询接口，不影响登录日志记录。
:::
