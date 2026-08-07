---
title: Schema Metadata | 数据库
---

# Schema Metadata

Schema Metadata 用于将数据库表结构导出为 PHP 元数据文件。

生成后的 metadata 包含表及字段的元数据信息，可供模型和其他组件读取。

## 生成 Metadata

执行以下命令生成 Schema Metadata：

```bash
php artisan pin:generate:table-schemas
```

生成的文件位于：

```text
database/schemas/{connection}/
```

更多命令选项，请参阅 [pin:generate:table-schemas](/digging-deeper/console.md#table-schemas)。

## 基本使用

模型可以通过 `metadata()` 获取表对应的 metadata：

```php
$meta = User::metadata();

$meta->label;
$meta->attributes['username'];
```

也可以通过连接名和表名读取：

```php
use Pin\Database\Schema\Metadata;

$meta = Metadata::make('default', 'users');
```

## 表名称

表名称默认从数据库表注释中解析。

```php
$table->comment('用户表');

User::metadata()->label; // 用户
```

当表注释包含多个部分时，仅使用第一部分：

```php
$table->comment('用户表|20260627|system');

User::metadata()->label; // 用户
```

如果未定义表注释，则根据表名生成默认表名：

```text
admin_users -> Admin User
```

::: info
表名会移除末尾的 `表` 后缀
:::

## 字段 Label

字段 Label 默认从字段注释中解析。

```php
$this->string('username', '用户名');

User::metadata()->attributes['username']; // 用户名
```

如果字段注释包含多个部分，仅使用第一部分：

```php
$this->string('username', '用户名|20260627|system');

User::metadata()->attributes['username']; // 用户名
```

如果字段未定义注释，则使用字段名生成默认 Label：

```text
created_at -> Created At
```

## 缓存

Schema Metadata 会在当前进程内缓存。

::: warning
在 Octane、队列 Worker 等常驻进程中，重新生成 metadata 后，需要重启对应进程。
:::
