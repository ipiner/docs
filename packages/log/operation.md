---
title: 操作日志 | 日志模块 | 扩展包
---

# 操作日志

操作日志用于记录业务对象的变更过程，每条日志记录操作者、操作对象、操作时间以及字段变化。

## 数据结构

操作日志额外包含以下字段：

| 字段    | 类型 | 说明     |
| ------- | ---- | -------- |
| changes | json | 变更内容 |

## 接入

在需要记录操作日志的模型中引入 `HasOperationLog`：

```php
use Pin\Modules\Log\Models\Concerns\HasOperationLog;
use Pin\Models\Model;

class Menu extends Model
{
    use HasOperationLog;

    protected function subjectNameColumn(): string
    {
        return 'name';
    }
}
```

`HasOperationLog` 会自动监听模型生命周期事件，并在数据发生变化时写入操作日志：

| Eloquent 事件  | 操作日志事件    |
| -------------- | --------------- |
| `created`      | `created`       |
| `updated`      | `updated`       |
| `deleted`      | `deleted`       |
| `forceDeleted` | `force-deleted` |
| `restored`     | `restored`      |

`subjectNameColumn()` 用于获取操作对象名称字段。
默认读取 `modules.log.operation.subject_name_columns.{table}` 配置。

如果未配置对应字段，该方法返回空值，操作日志不会被记录。

## 业务对象

操作日志中的 `subject` 表示本次操作作用的业务对象，用于标识被操作的数据实体。

默认字段来源：

| 字段           | 说明                                                              |
| -------------- | ----------------------------------------------------------------- |
| `subject_id`   | 当前模型的 `id`                                                   |
| `subject_name` | `subjectNameColumn()` 返回字段中的第一个非空值，未找到时使用 `id` |
| `subject_type` | 模型类名转换为 `kebab` 格式，例如 `AdminUser` 转换为 `admin-user` |

可通过 `subjectType()` 自定义业务对象类型：

```php
protected function subjectType(): string
{
    return 'user';
}
```

## 字段变更

模型字段变化会记录在操作日志的 `changes` 字段中。

更新记录包含变更前后的值：

```php
[
    'old' => [
        'name' => '旧名称',
    ],
    'new' => [
        'name' => '新名称',
    ],
]
```

创建记录仅包含新值：

```php
[
    'new' => [
        'name' => '名称',
    ],
]
```

### 字段忽略

字段变更默认会忽略以下字段：

```php
[
    'created_at',
    'updated_at',
]
```

可通过 `ignoredOperationAttributes()` 自定义忽略字段：

```php
protected function ignoredOperationAttributes(): array
{
    return [
        'created_at',
        'updated_at',
        'last_login_at',
    ];
}
```

对于不适合直接记录的字段值，可通过 `transformOperationValue()` 在写入日志前进行转换：

```php
protected function transformOperationValue(string $key, mixed $value): mixed
{
    return $key === 'password' ? '******' : $value;
}
```

### 合并额外变更

一次业务操作可能同时修改当前模型及关联数据。

可通过 `mergeOperationChanges()` 将额外字段变化合并到当前操作日志：

```php
$user->mergeOperationChanges(
    old: ['permissions' => 'read'],
    new: ['permissions' => 'read', 'write']
);
```

## 临时关闭操作日志

在批量导入、数据修复或测试数据生成等场景中，可通过 `withoutOperationLogging()` 临时关闭操作日志记录：

```php
User::withoutOperationLogging(function () use ($user) {
    $user->update([
        'name' => 'system import',
    ]);
});
```

## 内置路由

操作日志模块提供查询接口，用于查看操作记录及获取筛选项。

<p>
<a href="/images/operation-log.png" target="_blank">
    <img src="/images/operation-log.png" />
</a>
</p>

### 操作日志列表

`GET /api/system/log/operations` 用于分页查询操作日志，支持按业务对象、操作者、操作时间等条件筛选。

::: info
路由前缀 `/api/system/log` 可通过 `modules.log.routes.api_prefix` 配置。
:::

### 操作日志筛选项

`GET /api/system/log/operations/options` 用于获取操作日志查询所需的筛选条件。

## 附录

### 操作日志配置

`modules.log.operation` 用于配置操作日志：

```php

use Pin\Modules\Log\Controllers\OperationLogController;
use Pin\Modules\Log\Models\OperationLog;

'operation' => [
    'model' => OperationLog::class,
    'controller' => OperationLogController::class,
    'route_enabled' => true,
    'route_name' => 'system.log.operations',
    'subject_name_columns' => [],
],
```

| 配置项                 | 说明                                             |
| ---------------------- | ------------------------------------------------ |
| `model`                | 操作日志模型类，可按需覆盖                       |
| `controller`           | 操作日志控制器，可按需覆盖                       |
| `route_enabled`        | 是否启用内置操作日志路由                         |
| `route_name`           | 操作日志列表路由名称                             |
| `subject_name_columns` | 操作对象名称字段映射，键为数据表名，值为名称字段 |

::: info
关闭 `route_enabled` 后，仅禁用内置查询接口，不影响操作日志记录。
:::

### 操作日志示例

#### 日志内容

::: code-group

```json [创建（create）]
{
  "id": 59,
  "event": "created",
  "created_at": "2026-07-03 09:16:00",
  "uid": 1,
  "username": "admin",
  "user_type": "admin",
  "subject_type": "admin",
  "subject_id": 4,
  "subject_name": "pin",
  "changes": {
    "new": {
      "id": 4,
      "salt": "FI795ej0",
      "roles": "\n运营\n",
      "password": "******", // [!code highlight]
      "realname": "Pin",
      "username": "pin",
      "captcha_rule": "rev"
    }
  },
  "request_id": "69872774-cbde-4e5c-89b2-045d10f85bb0",
  "request_method": "POST",
  "request_url": "https://admin.ipiner.cn/api/system/admins",
  "route": "system.admins.create",
  "ip": "127.0.0.1",
  "event_name": "添加"
}
```

```json [更新（update）]
{
  "id": 53,
  "event": "updated",
  "created_at": "2026-07-02 22:47:38",
  "uid": 1,
  "username": "admin",
  "user_type": "admin",
  "subject_type": "role",
  "subject_id": 2,
  "subject_name": "运营",
  "changes": {
    "new": {
      "v": 4,
      "menus": "\n添加文章\n编辑文章\n添加文章分类\n编辑文章分类\n",
      "remark": "文章/分类管理权限"
    },
    "old": {
      "v": 3,
      "menus": "\n添加文章分类\n编辑文章分类\n管理员\n",
      "remark": ""
    }
  },
  "request_id": "50acc2d9-c3fb-45c6-9bed-27dc459b2750",
  "request_method": "PUT",
  "request_url": "https://admin.ipiner.cn/api/system/roles/2",
  "route": "system.roles.update",
  "ip": "127.0.0.1",
  "event_name": "更新"
}
```

:::

#### 字段变更预览

<p>
<a href="/images/create-operation-log.png" target="_blank">
    <img src="/images/create-operation-log.png" />
</a>
</p>

<a href="/images/update-operation-log.png" target="_blank">
    <img src="/images/update-operation-log.png" />
</a>
