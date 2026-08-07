---
title: 命令 | 继续深入
---

# 命令

Pin 提供了一组 Artisan 命令，用于处理项目开发中的常用操作。

## `pin:ide-helper` {#ide-helper}

`pin:ide-helper` 用于生成 IDE 辅助信息。

```bash
php artisan pin:ide-helper
```

该命令会依次执行：

```text
ide-helper:eloquent
ide-helper:generate
ide-helper:meta
ide-helper:models --nowrite --write-mixin
```

::: info

该命令依赖 [barryvdh/laravel-ide-helper](https://github.com/barryvdh/laravel-ide-helper)：

```bash
composer require --dev barryvdh/laravel-ide-helper
```

:::

## `pin:generate:table-schemas` {#table-schemas}

`pin:generate:table-schemas` 用于根据数据库表结构生成 schema metadata。

```bash
php artisan pin:generate:table-schemas
```

生成文件默认保存于：

```text
database/schemas/{connection}/
```

这些文件可以作为模型元数据、字段展示信息以及类型生成的数据来源。

### 参数

| 参数           | 默认值    | 说明                       |
| -------------- | --------- | -------------------------- |
| `--connection` | `default` | 指定数据库连接             |
| `--force`      | `false`   | 覆盖已存在的表 schema 文件 |

例如，为 `mysql` 连接重新生成 schema：

```bash
php artisan pin:generate:table-schemas --connection=mysql --force
```

### 生成文件

执行命令后，会生成以下文件：

| 文件                 | 说明                     |
| -------------------- | ------------------------ |
| `__schemas__.php`    | 所有表的完整 schema 信息 |
| `__attributes__.php` | 所有表的字段 label 映射  |
| `{table}.php`        | 单个表的 schema 定义     |

::: tip
生成后的 schema 文件可以提交到版本库。
:::

### Schema 文件结构

::: code-group

```php [__schemas__.php]
<?php

return [
    'users' => [
        'name' => 'users',
        'comment' => '用户表|20260615|pin',
        'label' => '用户',
        'columns' => [
            'id' => [
                'name' => 'id',
                'type_name' => 'int',
                'type' => 'int unsigned',
                'nullable' => false,
                'default' => null,
                'auto_increment' => true,
                'comment' => 'id|自增',
                'label' => 'id',
            ],

            'username' => [
                'name' => 'username',
                'type_name' => 'varchar',
                'type' => 'varchar(30)',
                'nullable' => false,
                'default' => null,
                'comment' => '用户名',
                'label' => '用户名',
            ],
        ],
    ],
];
```

```php [__attributes__.php]
<?php

return [
    'users' => [
        'id' => 'id',
        'username' => '用户名',
        'realname' => '姓名',
        'password' => '密码',
        'created_at' => '添加时间',
        'updated_at' => '更新时间',
    ],
];
```

```php [{table}.php]
<?php
// users.php

return [
    'label' => '用户',
    'attributes' => [
        ...(require __DIR__.'/__attributes__.php')['users'],
    ],
];

// 单表 schema 可补充自定义字段：

return [
    'label' => '用户',
    'attributes' => [
        ...(require __DIR__.'/__attributes__.php')['users'],
        'display_name' => '显示名称',
    ],
];
```

:::

### 使用 Schema Metadata

#### 模型元数据

Pin 模型可以通过 `metadata()` 方法获取对应的 schema metadata：

```php
$meta = User::metadata();

$meta->label;
$meta->attributes;
```

默认对应：

```text
database/schemas/default/users.php
```

例如：

```php
$meta->label;
$meta->attributes;
```

返回：

```php
用户

[
    'username' => '用户名',
    // ...
]
```

::: info

schema metadata 可用于字段展示、表单、列表、导出以及异常消息等场景。

:::

#### Action 验证

Action 验证时会使用模型 metadata 中的字段信息，用于生成字段名称和验证提示。

```php
protected function attributes(): array
{
    return $this->modelClass::metadata()->attributes;
}
```

#### 异常消息

模型查询不到数据时，Pin 会根据 schema metadata 中定义的 `label` 生成异常消息：

```php
User::firstOrFail($id);
```

响应示例：

```json
{
  "code": 404,
  "message": "用户不存在",
  "data": null
}
```

#### TypeScript 类型生成

通过 `/api/debug/typescript/generate` 生成 TypeScript 类型时，Pin 会读取：

```text
database/schemas/{connection}/__schemas__.php
```

并根据 schema metadata 生成：

- TypeScript 类型定义；
- 字段展示名称；
- 列表字段配置。

例如：

```ts
export type User = {
  createdAt: string; // 添加时间
  id: number; // id
  password: string; // 密码
  realname: string; // 姓名
  username: string; // 用户名
};

export const labels = {
  createdAt: "添加时间",
  id: "id",
  password: "密码",
  realname: "姓名",
  username: "用户名",
};
```
