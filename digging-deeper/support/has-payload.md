---
title: Payload（数据）| 支持工具 | 继续深入
---

# Payload（数据）

`Pin\Support\Traits\HasPayload` 为对象提供 payload 数据读写方法。

```php
use Pin\Support\Traits\HasPayload;

class UserService
{
    use HasPayload;
}
```

## 读取

读取全部：

```php
$data = $service->payload();
```

读取指定值：

```php
$profile = $service->payload('profile');
```

键名支持点语法访问嵌套数据：

```php
$name = $service->payload('profile.name');
```

::: info
如果指定的键不存在时，将返回 `null`。
:::

## 写入

单个写入：

```php
$service->payload('profile.name', 'Alice');
```

链式调用：

```php
$service->payload('profile.name', 'Alice')
    ->payload('profile.email', 'alice@example.com');
```

批量写入：

```php
$service->payload([
    'profile.name' => 'Alice',
    'profile.email' => 'alice@example.com',
]);
```

::: info
数组键名支持点语法。
:::

替换整个 payload：

```php
$service->payload(null, [
    'profile' => [
        'name' => 'Alice',
    ],
    'key' => 'value',
]);
```
