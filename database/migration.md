---
title: 数据库迁移 | 数据库
---

# 数据库迁移

Pin 扩展 Laravel 数据库迁移，提供统一的字段助手、注释约定和表结构规范。

## 创建迁移

`php artisan make:migration` 时，默认使用 Pin 提供的模板。

```php
use Illuminate\Database\Schema\Blueprint;

return new class extends Pin\Database\Migration
{
    public function up(): void
    {
        $this->schema()->create('users', function (Blueprint $table) {
            $this->useTable($table);

            $this->id();

            // $this->string('column', 'comment');

            $this->timestamps();
            $this->deleted();

            $table->comment($this->makeComment('xxx表', 'creator'));
        });
    }

    public function down(): void
    {
        $this->schema()->dropIfExists('users');
    }
};
```

::: info
使用 Pin 字段助手前，需要通过 `useTable($table)` 绑定当前表。
:::

## 字段助手

Pin 提供以下常用字段助手：

| 方法           | 说明           |
| -------------- | -------------- |
| `id()`         | 创建主键       |
| `string()`     | 创建字符串字段 |
| `json()`       | 创建 JSON 字段 |
| `timestamps()` | 创建时间字段   |
| `deleted()`    | 创建软删除字段 |
| `blameable()`  | 创建操作人字段 |
| `version()`    | 创建版本字段   |
| `requestId()`  | 创建请求 ID    |
| `morphs()`     | 创建多态字段   |

### `deleted()`

创建 Pin 风格的软删除字段。

```php
$this->deleted();
```

默认生成：

```text
deleted_at
```

字段默认值为 `0`。

::: info
与 Laravel 默认的 `nullable timestamp` 软删除字段不同，Pin 使用数值型删除时间标记，便于统一查询和索引策略。
:::

### `blameable()`

创建操作人追踪字段。

```php
$this->blameable();
```

生成字段：

```text
created_by
updated_by
```

两个字段默认值均为 `0`。

### `version()`

创建数据版本号字段。

```php
$this->version();
```

默认生成：

```text
v
```

字段默认值为 `1`。

## 注释约定

Pin 会读取表注释和字段注释，并将其用于 [schema metadata](/database/schema-metadata)。

字段注释：

```php
$this->string('username', '用户名');
```

表注释：

```php
$table->comment('用户表');
```

注释中的第一段会作为展示名称。

## 修改表结构

更新迁移中同样可以使用 Pin 提供的字段助手。

```php
$this->schema()->table('admins', function (Blueprint $table) {
    $this->useTable($table);

    $this->string('nickname', '昵称', 60, true)->after('realname');
});
```

## 使用原生 Blueprint

Pin 字段助手用于统一常见字段约定，未覆盖的场景可以直接使用 Laravel 原生 `Blueprint` API，例如：

- `decimal()`、`text()`、`boolean()` 等字段类型。
- 数据库特有能力。
- 复杂索引或其他高级表结构。
