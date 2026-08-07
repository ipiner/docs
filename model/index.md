---
title: 模型
---

# 模型

`Pin\Models\Model` 继承自 Eloquent Model，在 Laravel Eloquent 基础上约定常用模型行为，并扩展查询、事件、缓存和写入流程。

## 基础模型

```php
namespace App\Models;

use Pin\Models\Model;

class User extends Model
{
}
```

## 模型事件

模型启动时，将 Eloquent 事件自动映射到模型实例方法。
开发者无需在每个模型中手动注册 `static::created(...)` 等回调，只需按约定定义对应的 `onXxx()` 方法。

常用事件包括：

- `retrieved`
- `creating` / `created`
- `updating` / `updated`
- `saving` / `saved`
- `deleting` / `deleted`

示例：

```php
use Pin\Models\Model;

class User extends Model
{
    protected function onCreating(): void
    {
        parent::onCreating();
        $this->salt = $this->salt ?? Str::random(8);
        $this->password = Password::hash($this->password, $this->salt);
    }
}
```

## 模型查询

Pin 扩展 Laravel Query Builder，提供统一的查询、排序、分页和聚合方法。

示例：

```php
User::queryable($queryable)
    ->sort('username,-created_at')
    ->pagination();
```

详细用法请参考 [查询构建](/model/queryable)。

## 模型服务

模型主要负责数据访问约定，例如查询、缓存、事件和模型行为。

`Pin\Services\ModelService` 用于收口一次完整的写入流程，包括创建、更新、删除、分页和结果对象处理。

详细用法请参考 [模型服务](/model/service)。

## ID 生成

当数据表不使用 `AUTO_INCREMENT` 主键时，可使用 `GeneratorId` 系列 Trait 由应用层生成主键。

- `Pin\Models\Concerns\TimestampId`：基于时间戳生成 ID。
- `Pin\Models\Concerns\RedisId`：基于 Redis 自增序列生成 ID。
- `Pin\Models\Concerns\SnowflakeId`：基于 Snowflake 算法生成 ID。

更多说明请参考 [ID 生成](/digging-deeper/id-generate)。

## 软删除

`Pin\Models\Concerns\SoftDeletes` 支持使用整数时间戳记录删除状态。

与 Laravel 默认使用 `deleted_at` 为 `NULL` 表示未删除不同，Pin 使用 `0` 表示正常状态，删除时写入删除时间戳。

这种方式更适合需要基于删除状态建立唯一约束的场景。

例如，业务要求 `username` 在未删除数据中保持唯一，可以使用组合唯一索引：

```sql
unique(username, deleted_at)
```

正常数据的 `deleted_at` 默认为 `0`，删除时写入对应的整数时间戳。

## 创建人和更新人

`Pin\Models\Concerns\HasBlameable` 用于自动维护创建人和更新人字段。

- 创建时同时填充 `created_by` 和 `updated_by`。
- 更新时刷新 `updated_by`。

```php
use Pin\Models\Model;
use Pin\Models\Concerns\HasBlameable;

class Product extends Model
{
    use HasBlameable;
}
```
