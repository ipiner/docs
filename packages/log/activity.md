---
title: 行为日志 | 日志模块 | 扩展包
---

# 行为日志

行为日志用于记录用户或系统产生的业务行为事件。

每条日志包含行为标识、操作对象、请求信息以及上下文数据。

## 数据结构

行为日志额外包含以下字段：

| 字段    | 类型        | 说明       |
| ------- | ----------- | ---------- |
| title   | string(255) | 标题       |
| context | json        | 上下文数据 |

## 创建行为日志

通过 `ActivityPayload` 构建行为日志数据，并使用 `Log::create()` 写入日志。

`event` 用于标识行为类型，例如 `order.export` 表示订单导出。

```php
use Pin\Modules\Log\Facades\Log;
use Pin\Modules\Log\Payloads\ActivityPayload;

$payload = new ActivityPayload('order.export')
    ->title('导出订单')
    ->subject(
        $order->id,
        $order->order_no,
        'order',
    )
    ->context([
        'count' => 100,
        'format' => 'xlsx',
    ]);

Log::create($payload);
```

## 内置路由

行为日志模块提供查询接口，用于查看行为日志及获取筛选项。

### 行为日志列表

`GET /api/system/log/activities` 用于分页查询行为日志，支持按业务对象、操作者、操作时间等条件筛选。

::: info
路由前缀 `/api/system/log` 可通过 `modules.log.routes.api_prefix` 配置。
:::

### 行为日志筛选项

`GET /api/system/log/activities/options` 用于获取行为日志查询所需的筛选条件。

## 附录

### 行为日志配置

`modules.log.activity` 用于配置行为日志：

```php

use Pin\Modules\Log\Controllers\ActivityLogController;
use Pin\Modules\Log\Models\ActivityLog;

'activity' => [
    'model' => ActivityLog::class,
    'controller' => ActivityLogController::class,
    'route_enabled' => true,
    'route_name' => 'system.log.activities',
],
```

| 配置项          | 说明                       |
| --------------- | -------------------------- |
| `model`         | 行为日志模型类，可按需覆盖 |
| `controller`    | 行为日志控制器，可按需覆盖 |
| `route_enabled` | 是否启用内置行为日志路由   |
| `route_name`    | 行为日志列表路由名称       |

::: info
关闭 `route_enabled` 后，仅禁用内置查询接口，不影响行为日志记录。
:::
