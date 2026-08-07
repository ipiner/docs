---
title: 模型缓存 | 模型
---

# 模型缓存

Pin 为模型提供缓存扩展能力，由模型统一定义缓存策略、缓存键和失效规则。

启用缓存后，业务代码仍然使用模型提供的查询方法，无需额外维护缓存逻辑。

## 缓存模式

Pin 提供三种模型缓存模式：
| 模式 | Trait | 说明 |
| ----------- | ----------- | ------------ |
| `None` | 无 | 不启用模型缓存 |
| `CacheItem` | `CacheItem` | 按主键缓存单条记录 |
| `CacheAll` | `CacheAll` | 缓存全部记录并按主键索引 |

## 缓存启用

为模型引入对应的 Trait 即可启用缓存。

```php
use Pin\Models\Concerns\CacheAll;
use Pin\Models\Concerns\CacheItem;
use Pin\Models\Model;

class Admin extends Model
{
    use CacheItem;
}

class Menu extends Model
{
    use CacheAll;
}
```

也可以覆写 `cacheType()`，返回对应的 `CacheType`，以自定义缓存策略。。

## 缓存读取

启用缓存后，Pin 提供的模型查询方法会自动使用对应缓存策略：

- `find(int $id)`：按主键查询单条记录
- `findOrFail(int $id)`：按主键查询单条记录，不存在时抛出异常
- `findAll()`：查询全部记录，返回按 ID 索引的集合
- `findBy(string $column, mixed $value)`：按字段查询单条记录
- `findMany(array $ids)`：按主键批量查询多条记录

## 缓存失效

模型保存或删除后，会在 Eloquent `saved`、`deleted` 事件触发后自动清除相关缓存。

## 缓存分层

模型缓存采用两级缓存：

- **L1 本地缓存**：基于进程内缓存存储，默认使用 `array` Store。普通 PHP-FPM 请求生命周期内有效；常驻进程环境下生命周期由 Worker 决定。
- **L2 分布式缓存**：基于 [redis-hash](/digging-deeper/cache#redis-hash)，用于跨请求、跨进程共享缓存数据。

缓存读取顺序如下：

```txt
L1 本地缓存 -> L2 分布式缓存 -> 数据库
```

读取过程如下：

- L1 命中时，直接返回结果。
- L1 未命中但 L2 命中时，返回 L2 数据，并回填到 L1。
- L1 和 L2 都未命中时，查询数据库，并写入对应缓存层。

::: info
更底层的 `ArrayStore`、`redis-hash` 和缓存 key 规则，可参考 [缓存](/digging-deeper/cache)。
:::

## 缓存 Key

不同缓存模式使用不同的缓存键：

| 模式        | Key         |
| ----------- | ----------- |
| `CacheItem` | `table:id`  |
| `CacheAll`  | `table-all` |

简单统一的命名规则有助于排查缓存命中、缓存失效以及数据一致性问题。

## 单条缓存

使用 `CacheItem` 时，模型会按主键缓存单条记录。

例如：

```txt
admins:1
```

该模式适合单条读取频繁、数据规模较大或不适合整体加载的模型。

## 全量缓存

使用 `CacheAll` 时，模型会将整张表缓存为一个集合，并按 `id` 索引。

例如：

```txt
menus-all
```

::: info
在全量缓存模式下，`findBy()` 不会回源数据库，而是直接在已缓存的数据集中执行内存查找。

因此 `findBy()` 适合字段数量有限、数据量可控的基础表。
:::

::: warning
`CacheAll` 会加载整张表数据，适合数据量较小、读取频繁、变更较少的基础数据，例如菜单、字典、配置项等，不适合数据量大或更新频繁的业务表。
:::

## 空值缓存

Pin 使用 `NullPlaceholder` 防止缓存穿透。

当查询结果不存在时，系统会缓存一个空值占位对象，而不是持续回源数据库。

在占位对象有效期内，再次查询相同数据会直接返回 `null`，从而减少无效数据库访问。

## 缓存 TTL

缓存默认有效期为 `7` 天（`604800` 秒）。

可以通过自定义 `cacher()` 调整模型缓存器配置，例如修改 TTL：

```php
use Pin\Cache\Cacher;
use Pin\Cache\SimpleCacher;
use Pin\Models\Model;

class User extends Model
{
    protected static function cacher(): Cacher
    {
        return static::$cacher[static::class]
            ??= new SimpleCacher(static::class)->ttl(30 * 86400);
    }
}
```
