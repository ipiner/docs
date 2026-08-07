---
title: Context（上下文）| 支持工具 | 继续深入
---

# Context（上下文）

`Pin\Support\Traits\HasContext` 为对象提供上下文读写方法。

```php
use Pin\Support\Traits\HasContext;

class UserService
{
    use HasContext;
}
```

## 读取

读取全部：

```php
$context = $service->context();
```

读取指定值：

```php
$paging = $service->context('paging');
```

键名支持点语法访问嵌套数据：

```php
$name = $service->context('actor.name');
```

::: info
如果指定的键不存在时，将返回 `null`。
:::

## 写入

单个写入：

```php
$service->context('actor.name', 'Alice');
```

链式调用：

```php
$service->context('actor.name', 'Alice')
    ->context('actor.id', 10000);
```

批量写入：

```php
$service->context([
    'actor.name' => 'Alice',
    'actor.id' => 10000,
]);
```

::: info
数组键名支持点语法。
:::

替换整个 context：

```php
$service->context(null, [
    'actor' => [
        'name' => 'Alice',
    ],
    'key' => 'value',
]);
```
