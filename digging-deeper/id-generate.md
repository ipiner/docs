---
title: ID 生成 | 继续深入
---

# ID 生成

Pin 提供统一的 ID 生成入口，用于在应用中生成 ID。

## 基本使用

`Id::generate()` 使用默认生成器生成 ID。

生成单个 ID：

```php
use Pin\IdGenerator\Id;

$id = Id::generate();
// 771584229910
```

生成多个 ID：

```php
$ids = Id::generate(10);
// [771584229926, 771584229927, ...]
```

::: info
默认生成器可通过 `pin.id-generator.default` 配置：

```php
<?php
use Pin\IdGenerator\IdGenerator;

return [
    'default' => IdGenerator::Redis, // 默认 IdGenerator::Timestamp
];

```

:::

## 生成器

ID 生成由生成器实现。Pin 提供了多种内置生成器，用于生成不同类型的 ID。

### Redis 生成器

`Redis` 生成器基于 Redis Store 的自增能力生成整数 ID。

```php
use Pin\IdGenerator\IdGenerator;

$id = IdGenerator::Redis->generate();
// 152

$ids = IdGenerator::Redis->generate(10);
// [153, 154, ...]
```

::: info
`Redis` 生成器默认配置：

```php
'redis' => [
    // Redis 序列名称
    'name' => 'default',
    // 是否启用分布式锁
    'use_lock' => false,
]
```

:::

### Timestamp 生成器

`Timestamp` 生成器基于时间差生成趋势递增的整数 ID。

```php
use Pin\IdGenerator\IdGenerator;

$id = IdGenerator::Timestamp->generate();
// 771584229910

$ids = IdGenerator::Timestamp->generate(10);
// [771584229926, 771584229927, ...]
```

::: info
`Timestamp` 生成的 ID 会随时间增长，但不保证严格递增。

`Timestamp` 生成器默认配置：

```php
'timestamp' => [
    // ID 起始时间戳，可缩短最终 ID 长度，默认 1777593600
    'start_timestamp' => TimestampId::START_TIMESTAMP,
],
```

:::

### Snowflake 生成器

`Snowflake` 生成器基于 [godruoyi/php-snowflake](https://github.com/godruoyi/php-snowflake) 生成全局唯一 ID。

使用前需要安装对应依赖：

```bash
composer require godruoyi/php-snowflake
```

```php
use Pin\IdGenerator\IdGenerator;

$id = IdGenerator::Timestamp->generate();
// "297028613288571332"

$ids = IdGenerator::Timestamp->generate(10);
// ["297028613292765559", "297028613292765560", ...]
```

::: info
`Snowflake` 生成器默认配置：

```php
'snowflake' => [
    // 数据中心 ID，默认随机
    'data_center' => -1,

    // 机器节点 ID，默认随机
    'worker_id' => -1,

    // 起始时间戳
    'start_timestamp' => 1714492800,
],
```

:::

#### 解析 ID

Snowflake ID 可以解析出生成时间、序列号以及节点信息：

```php
$info = $generator->parseId($id);
```

返回：

```php
[
    'timestamp' => 1714492800,
    'sequence' => 1,
    'workerid' => 12,
    'datacenter' => 1,
]
```

### 自定义生成器

如果内置生成器无法满足需求，可以实现 `Pin\IdGenerator\IdGeneratorInterface` 定义自定义生成器。

自定义生成器需要注册到容器，并使用以下服务名称：

```text
pin.id.{name}
```

例如：

```php
use Pin\IdGenerator\IdGeneratorInterface;

app()->instance('pin.id.uniqid', new class implements IdGeneratorInterface
{
    public function generate(int $count = 1): array|string
    {
        $ids = [];

        for ($i = 0; $i < $count; $i++) {
            $ids[] = uniqid();
        }

        return $count === 1 ? $ids[0] : $ids;
    }
});
```

注册后，可以将其设为默认生成器：

```php
// config/pin/id-generator.php

return [
    'default' => 'uniqid',
];

```

```php
$id = Id::generate();
// 6a69ae7387408
```

也可以在调用时指定：

```php
$id = Id::generate(1, 'uniqid');

$ids = Id::generate(10, 'uniqid');
```
