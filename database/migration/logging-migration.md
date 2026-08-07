---
title: 日志表迁移 | 数据库
---

# 日志表迁移

`Pin\Database\LoggingMigration` 是 Pin 为日志表提供的专用迁移基类。

它继承自 `Pin\Database\Migration`，因此可以继续使用普通迁移中的 `schema()`、`useTable()`、`id()`、`string()` 等字段助手。同时，它还提供了一组面向日志场景的字段组合方法，用于统一日志表的基础结构。

`LoggingMigration` 适用于操作日志、行为日志、审计日志、系统任务日志等需要记录事件、行为主体、关联对象和请求上下文的场景。

## 为什么单独做日志迁移

日志表通常会反复出现几类信息：

- 事件本身：发生了什么。
- 行为主体：谁触发了这次事件，可以是用户、管理员、系统任务或外部应用。
- 关联对象：事件作用到哪个业务对象。
- 请求上下文：来自哪个请求、路由、IP、URL 或命令行任务。

如果每张日志表都手写这些字段，很容易出现字段名不一致、索引遗漏、长度不统一的问题。

`LoggingMigration` 将这些字段组合成几个可复用方法，让不同类型的日志表保持一致的结构约定。

## 基本示例

```php
use Illuminate\Database\Schema\Blueprint;

return new class extends Pin\Database\LoggingMigration
{
    public function up(): void
    {
        $this->schema()->create('activity_logs', function (Blueprint $table) {
            $this->useTable($table);

            $this->base();
            $this->user();
            $this->subject();
            $this->request();

            $table->comment($this->makeComment('行为日志表', 'system'));
        });
    }

    public function down(): void
    {
        $this->schema()->dropIfExists('activity_logs');
    }
};
```

::: tip
在 `Blueprint` 闭包中，需要先调用：

```php
$this->useTable($table);
```

日志字段组合方法会基于当前绑定的 `Blueprint` 实例工作。
:::

## 字段组合

`LoggingMigration` 提供以下字段组合方法：

| 方法        | 字段                                                         | 说明                  |
| ----------- | ------------------------------------------------------------ | --------------------- |
| `base()`    | `id`、`event`、`created_at`                                  | 日志基础字段          |
| `user()`    | `uid`、`username`、`user_type`                               | 行为主体信息          |
| `subject()` | `subject_type`、`subject_id`、`subject_name`，并添加对象索引 | 关联对象信息          |
| `request()` | `request_id`、`request_method`、`request_url`、`route`、`ip` | HTTP / Console 上下文 |

这些方法可以按需组合，不要求每张日志表都完整使用。

## `base()`

`base()` 用于创建日志表的基础字段。

```php
$this->base();
```

生成字段：

| 字段         | 类型                 | 说明             |
| ------------ | -------------------- | ---------------- |
| `id`         | `unsigned int` 主键  | 日志 ID          |
| `event`      | `string(30)`         | 事件名称，加索引 |
| `created_at` | `timestamp nullable` | 日志时间，加索引 |

`event` 适合保存短事件名，例如：

```text
created
updated
deleted
approved
login
logout
viewed
exported
```

## `user()`

`user()` 用于记录行为主体信息。

```php
$this->user();
```

生成字段：

| 字段        | 类型                   | 说明     |
| ----------- | ---------------------- | -------- |
| `uid`       | `unsigned big integer` | 主体 ID  |
| `username`  | `string(30)`           | 主体名称 |
| `user_type` | `string(30)`           | 主体类型 |

::: tip
`user_type` 适合区分不同来源，例如后台管理员、前台用户、系统任务、开放平台应用等。

对于系统自动触发的日志，也可以使用固定的主体类型，例如 `system`、`console`、`api_client`。
:::

## `subject()`

`subject()` 用于记录事件关联的业务对象。

```php
$this->subject();
```

生成字段：

| 字段           | 类型                             | 说明         |
| -------------- | -------------------------------- | ------------ |
| `subject_type` | `string(120)`，默认空字符串      | 关联对象类型 |
| `subject_id`   | `unsigned big integer`，默认 `0` | 关联对象 ID  |
| `subject_name` | `string(500)`，默认空字符串      | 关联对象名称 |

同时会添加对象索引：

```php
$this->table->index(['subject_type', 'subject_id']);
```

该索引适合查询某个业务对象的日志历史，例如某篇文章、某个订单、某个用户、某个配置项的全部相关日志。

`subject_type` 可以保存模型类名、业务对象类型或自定义标识，例如：

```text
article
order
user
setting
App\Models\Order
```

## `request()`

`request()` 用于记录请求或命令行上下文。

```php
$this->request();
```

生成字段：

| 字段             | 类型          | 说明                                |
| ---------------- | ------------- | ----------------------------------- |
| `request_id`     | `string(36)`  | 请求 ID，加索引                     |
| `request_method` | `string(10)`  | HTTP 方法；命令行下可保存 `console` |
| `request_url`    | `string(500)` | 请求 URL；命令行下可保存命令参数    |
| `route`          | `string`      | 路由名称或路由 URI                  |
| `ip`             | `string(45)`  | 客户端 IP，兼容 IPv6                |

::: tip
这些字段可以帮助日志与请求日志、SQL 日志、异常日志进行关联分析。

在命令行任务中，`request_method` 可以保存 `console`，`request_url` 可以保存命令名称或命令参数。
:::

## 按需组合

不是所有日志表都必须使用全部字段组合。可以根据日志类型选择需要的字段。

只记录系统任务日志时，可以使用基础字段和请求上下文：

```php
$this->base();
$this->request();
```

记录业务对象变更日志时，建议加入关联对象字段：

```php
$this->base();
$this->subject();
```

记录用户行为日志时，建议加入行为主体和请求上下文：

```php
$this->base();
$this->user();
$this->request();
```

记录完整的业务行为日志时，可以使用全部字段组合：

```php
$this->base();
$this->user();
$this->subject();
$this->request();
```

## 扩展业务字段

`LoggingMigration` 继承自 `Pin\Database\Migration`，因此普通迁移中的字段助手仍然可用。

例如，可以在日志表中增加模块、摘要、日志数据等业务字段：

```php
$this->base();
$this->user();
$this->subject();
$this->request();

$this->string('module', '模块', 60, true);
$this->string('summary', '摘要', 255, true);
$this->json('payload', '日志数据');
```

也可以直接使用 Laravel 原生 `Blueprint` API：

```php
$table->text('message')->nullable()->comment('日志内容');
$table->json('context')->nullable()->comment('上下文数据');
```

::: tip
推荐实践是：日志通用字段使用 `LoggingMigration` 提供的组合方法，业务扩展字段使用普通字段助手或 Laravel 原生 `Blueprint` API。
:::

## 完整示例

下面是一个包含通用字段和业务扩展字段的日志表迁移示例：

```php
use Illuminate\Database\Schema\Blueprint;

return new class extends Pin\Database\LoggingMigration
{
    public function up(): void
    {
        $this->schema()->create('activity_logs', function (Blueprint $table) {
            $this->useTable($table);

            $this->base();
            $this->user();
            $this->subject();
            $this->request();

            $this->string('module', '模块', 60, true);
            $this->string('summary', '摘要', 255, true);
            $this->json('payload', '日志数据');

            $table->comment($this->makeComment('行为日志表', 'system'));
        });
    }

    public function down(): void
    {
        $this->schema()->dropIfExists('activity_logs');
    }
};
```
