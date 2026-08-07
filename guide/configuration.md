---
title: 配置 | 入门指南
---

# 配置

Pin 基于 Laravel 配置体系扩展了配置加载流程，支持配置分层、环境覆盖和递归合并。

## 配置层级 {#layers}

Pin 的配置分为以下几个层级：

1. **默认配置**

   Pin 内置配置。

2. **应用配置**

   应用配置文件。

3. **模块环境配置**

   单个配置文件的环境覆盖。

4. **全局环境配置**

   多个配置项的统一覆盖。

## 配置加载顺序

Pin 按以下顺序加载配置，后加载的配置具有更高优先级：

```text
默认配置 → 应用配置 → 模块环境配置 → 全局环境配置
```

1. **默认配置**

   Pin 内置配置文件：

   ```text
   pin/config/*.php
   ```

2. **应用配置**

   应用自定义配置文件：

   ```text
   app/config/*.php
   ```

3. **模块环境配置**

   针对单个配置文件的环境覆盖：

   ```text
   pin/config/{name}.{env}.php
   app/config/{name}.{env}.php
   ```

4. **全局环境配置**

   针对多个配置项的统一环境覆盖：

   ```text
   pin/config/config.{env}.php
   app/config/config.{env}.php
   ```

例如当前运行环境为 `local`，加载 `database` 配置时，Pin 会依次加载并递归合并以下配置：

1. `pin/config/database.php`
2. `app/config/database.php`
3. `pin/config/database.local.php`（如果存在）
4. `app/config/database.local.php`（如果存在）
5. `pin/config/config.local.php` 中的 `database` 配置（如果存在）
6. `app/config/config.local.php` 中的 `database` 配置（如果存在）

::: info
配置加载完成后，Pin 会将最终配置写入 Laravel 配置仓库，应用代码仍可通过 `config()` 访问配置。
:::

## 环境配置

环境配置用于处理不同运行环境之间的差异，例如本地开发、自动化测试、预发布和生产环境。

常见环境名称包括：

```txt
local
testing
staging
production
```

Pin 支持两种环境配置方式：

- 模块环境配置：针对单个配置文件进行环境覆盖。
- 全局环境配置：在一个环境下集中覆盖多个配置项。

### 模块环境配置

模块环境配置用于覆盖单个配置文件。

文件名格式：

```txt
config/{name}.{env}.php
```

例如：

```txt
config/database.local.php
config/cache.production.php
config/app.testing.php
```

当前运行环境为 `local` 时，`config/database.local.php` 会被加载并合并到 `config/database.php` 对应的配置中。

### 全局环境配置

全局环境配置用于在一个运行环境下集中覆盖多个配置项。

文件名格式：

```txt
{config}/config.{env}.php
```

例如：

```txt
config/config.local.php
config/config.production.php
config/config.testing.php
```

全局环境配置按照配置名称组织：

```php
// config/config.local.php

return [
    'app' => [
        // ...
    ],

    'database' => [
        'connections' => [
            // ...
        ],
    ],
];
```

在此示例中：

- `app` 配置会合并到最终的 `app` 配置中。
- `database` 配置会合并到最终的 `database` 配置中。

::: warning
全局环境配置**不会参与 Laravel 配置缓存，而是在每次请求时重新加载**，因此可以根据运行时上下文动态调整配置，例如：

- 服务器环境变量（`$_SERVER`）
- 当前请求信息

读取请求相关数据时，应先进行校验、过滤或限制来源，避免将未经验证的外部输入直接写入配置。
:::

## 测试环境

当 Pin 检测到当前应用运行在测试环境时，会将当前环境标识为 `testing`。

此时，Pin 会自动加载对应的测试环境配置：

```txt
config/{name}.testing.php
config/config.testing.php
```

例如：

```txt
config/database.testing.php
config/cache.testing.php
config/config.testing.php
```

测试环境配置与其他运行环境（如 `local、staging`、`production`）采用相同的组织方式。

## 递归合并

Pin 合并数组配置时遵循以下规则：

- **字符串 key**：同名配置覆盖，后加载的配置优先。
- **整数 key**：按顺序追加，行为等同于 `array_merge`。
- **嵌套数组**：继续递归应用以上规则。

例如，Pin 默认配置中包含：

```php
// pin/config/app.php

return [
    'x_api_document' => [
        'allows' => ['Scramble', 'docs/api'],
    ],
];
```

应用配置中包含：

```php
// app/config/app.php

return [
    'x_api_document' => [
        'allows' => ['Apifox'],
    ],
];
```

由于 `allows` 是整数索引数组，应用配置中的 `Apifox` 会追加到原数组末尾，而不会替换整个数组。

最终结果：

```php
config('app.x_api_document.allows');

// [
//     'Scramble',
//     'docs/api',
//     'Apifox',
// ]
```

::: info
如果希望某些配置项完全替换而不是追加，建议将配置结构设计为关联数组，或在应用配置中提供明确的替换机制，以确保最终配置结果符合预期。
:::
