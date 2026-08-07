---
title: 连接配置 | 数据库
---

# 连接配置

Pin 提供 `Pin\Database\Config::mysql()`，用于基于连接名生成数据库连接配置。

## 基本用法

Pin 默认提供了名为 `default` 的 MySQL 连接配置。

```php
// config/database.php

use Pin\Database\Config;
use Pin\Models\Model;

return [
    'connections' => [
        Model::CONNECTION_DEFAULT => Config::mysql(Model::CONNECTION_DEFAULT),
    ],
];
```

覆盖默认配置：

```php
Config::mysql('default', [
    'port' => 3986
]);
```

## 环境变量命名规则

`Config::mysql($connection)` 连接名会转换为大写格式，并按以下格式读取环境变量：

```text
{CONNECTION}_DB_{KEY}
```

例如：

| 连接名      | 环境变量前缀    |
| ----------- | --------------- |
| `default`   | `DEFAULT_DB_`   |
| `report`    | `REPORT_DB_`    |
| `archive`   | `ARCHIVE_DB_`   |
| `read_only` | `READ_ONLY_DB_` |

## 配置项

`Config::mysql()` 支持 Laravel MySQL 连接的所有配置项，并通过对应的环境变量自动读取配置。此外，Pin 还扩展了 `slow_threshold` 配置项，用于 SQL 慢查询监控。

`slow_threshold` 支持秒和毫秒：

| 配置  | 阈值   |
| ----- | ------ |
| `2`   | 2000ms |
| `0.5` | 500ms  |
| `500` | 500ms  |

规则：

- `<=10` 按秒解析；
- `>10` 按毫秒解析。

默认值为 `2`，即 `2000ms`。
