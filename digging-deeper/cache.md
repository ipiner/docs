---
title: 缓存 | 继续深入
---

# 缓存

Pin 提供两种缓存实现：

- `RuntimeCache`：进程内缓存。
- `HashCache`：基于 Redis Hash 的缓存。

## 进程内缓存 {#runtime}

`RuntimeCache` 将数据保存在当前 PHP 进程中，不会在不同进程之间共享。

::: info
在 PHP-FPM 模式下，进程内缓存通常只在当前请求期间有效。

在 Octane、Swoole、RoadRunner 等长驻服务中，同一个 Worker 会处理多个请求，进程内缓存会跨请求共享。
:::

### 基本用法

```php
use Pin\Support\Facades\RuntimeCache;
```

#### 写入缓存

```php
RuntimeCache::put('app.settings', $settings);
```

默认 TTL 为 `86400` 秒，可在写入时指定过期时间：

```php
RuntimeCache::put('app.settings', $settings, 3600);
```

#### 读取缓存

```php
$settings = RuntimeCache::get('app.settings');
```

指定默认值：

```php
$settings = RuntimeCache::get('app.settings', []);
```

缓存不存在时，自动生成并缓存结果：

```php
$settings = RuntimeCache::remember(
    'app.settings',
    fn () => Setting::all()
);
```

为缓存结果指定过期时间：

```php
$settings = RuntimeCache::remember(
    'app.settings',
    fn () => Setting::all(),
    3600
);
```

`rememberForever` 用于缓存不会自动过期的数据：

```php
$settings = RuntimeCache::rememberForever(
    'app.settings',
    fn () => Setting::all()
);
```

::: info
`rememberForever` 不会设置过期时间，缓存仍会在当前 PHP 进程结束时释放。:::
:::

#### 删除缓存

```php
RuntimeCache::delete('app.settings');
```

#### 清除缓存

```php
RuntimeCache::flush();
```

### 查看缓存

获取当前进程中的所有缓存：

```php
$items = RuntimeCache::all();
```

按前缀筛选：

```php
$menus = RuntimeCache::all('app.');
```

### 生命周期

进程内缓存会在以下情况失效：

- TTL 到期
- 手动删除缓存
- 清空缓存
- PHP 进程结束

## Redis Hash 缓存 {#redis-hash}

Redis Hash 缓存（`HashCache`）基于 Laravel Cache Store 实现，使用 Redis Hash 存储数据。

缓存 key 约定为 `hash key:field` 格式，以支持字段级读写。

### 配置

`redis-hash` Store 默认配置如下：

```php
// config/cache.php

'stores' => [
    'redis-hash' => [
        // Redis 连接
        'connection' => 'cache',
        // 默认过期时间（秒）
        'ttl' => 604800,
    ],
],
```

### Key 解析

`HashCache` 使用最后一个 `:` 分隔 key：

- 前面的部分作为 hash key；
- 最后一段作为 field。

例如：

```php
use Pin\Support\Facades\HashCache;

HashCache::put('users:1', ['name' => 'Pin']);
```

实际写入：

```text
hash key: users
field: 1
value: {"name":"Pin"}
```

::: info
当 key 中包含多个 `:` 时，`HashCache` 仍然使用最后一个 `:` 进行解析。

例如：

```text
tests:users:1 -> hash key: tests:users, field: 1
```

:::

### 基本用法

`HashCache` 的使用方式与 Laravel Cache 保持一致。

#### 写入

写入单个字段：

```php
HashCache::put('users:1', ['name' => 'Pin']);
```

批量写入字段：

```php
HashCache::putMany([
    'users:1' => ['name' => 'Pin'],
    'users:2' => ['name' => 'Alice'],
]);
```

::: warning
`putMany()` 要求所有 key 属于同一个 hash key。
:::

#### 读取

读取单个字段：

```php
HashCache::get('users:1');
```

```json
{
    "name": "Pin"
},
```

读取整个 hash：

```php
HashCache::getAll('users');
```

```json
{
    "1": {
        "name": "Pin"
    },
    "2": {
        "name": "Alice"
    }
},
```

#### 删除

删除字段：

```php
HashCache::forget('users:1');
```

删除整个 hash：

```php
HashCache::del('users');
```

#### TTL

为减少 Redis 过期时间更新带来的开销，TTL 更新采用惰性策略，默认约 `5%` 的调用会触发实际的 `expire` 操作。

::: info
Redis Hash 的过期时间作用于整个 hash，而不是单个 field，因此 TTL 设置对应的是 hash key。
:::

可通过 `touch()` 主动更新 TTL。

```php
HashCache::touch('users', 3600);
```

使用 `hash key:field` 格式时，会自动提取 hash key：

```php
HashCache::touch('users:1', 3600);
```
