---
title: 验证 | 核心功能
---

# 验证

Pin 扩展 Laravel Validation 能力，将验证规则作为数据定义入口，贯通参数校验与[查询构建](/model/queryable)。

## 基础规则

### Enum

`Enum` 规则用于验证枚举值。

```php
use Pin\Validation\Rules\Enum;

enum UserStatus: int
{
    case Disabled = 0;
    case Enabled = 1;
}

public function rules(): array
{
    return [
        'status' => ['required', new Enum(UserStatus::class)],
    ];
}
```

验证失败时，默认使用 `validation.enum` 语言键生成错误消息。
可通过 `message()` 方法自定义错误消息，传入的内容会作为可翻译文本处理。

```php
new Enum(...)->message('状态异常');

// 指定占位符
new Enum(...)->message(':attribute异常')
```

::: info
对于字符串枚举，值匹配区分大小写。
:::

### Unique

`Unique` 规则用于验证模型字段是否唯一。

相比 Laravel 内置的 `unique` 规则，`Unique` 以模型类作为验证目标，而不是直接指定数据表。

```php
use App\Models\User;
use Pin\Validation\Rules\Unique;

public function rules(): array
{
    return [
        'username' => [
            'required',
            new Unique(User::class),
        ],
    ];
}
```

验证失败时，默认使用 `validation.unique` 语言键生成错误消息。
可通过 `message()` 方法自定义错误消息，传入的内容会作为可翻译文本处理。

```php
new Enum(...)->message('手机号已被使用');

// 指定占位符
new Enum(...)->message(':attribute已被使用')
```

#### 忽略当前记录

更新数据时，可通过 `ignore()` 方法忽略当前记录：

```php
new Unique(User::class)->ignore($id);
```

::: info
`ignore` 使用模型主键 `id` 进行记录排除。
:::

#### 查询条件

可通过 `where()` 方法添加额外查询条件：

```php
new Unique(User::class)
    ->where('tenant_id', tenant()->id);
```

也可以通过 `whereNot` 添加排除条件：

```php
new Unique(User::class)
    ->whereNot('status', 'archived');
```

## 查询规则 {#queryable}

Pin 支持在验证规则中声明查询规则，使同一套规则可同时用于数据验证与 Eloquent 查询构建。

```php
use Pin\Validation\QueryableRules as Queryable;

$rules = [
    'subject' => Queryable::ns('subject_id,subject_name'),
    'event' => Queryable::in('string'),
    'created_at' => Queryable::range(),
    'sort' => 'nullable|string|in:id,created_at',
];
```

上述规则将根据请求参数构建以下查询条件：

| 字段         | 查询方式                                                 |
| ------------ | -------------------------------------------------------- |
| `subject`    | 数值精确匹配 `subject_id` 或 文本包含匹配 `subject_name` |
| `event`      | `IN` 查询                                                |
| `created_at` | 时间范围查询                                             |
| `sort`       | 普通验证规则，不参与查询                                 |

例如请求：

```http
GET /api/system/logs?
&subject=M2026123456
&event=created,updated
&created_at=2026-01-01,2026-01-31
&sort=created_at
```

将生成以下查询语义：

```sql
subject_name like '%M2026123456%'
and event in ('created', 'updated')
and created_at >= '2026-01-01' and created_at <= '2026-01-31'
order by created_at desc
```

可用查询规则及查询声明的完整用法参见 [查询构建](/model/queryable)。

### 添加验证规则

`QueryableRules` 是声明验证规则和查询规则的快捷方式，仍可继续追加 Laravel 内置验证规则。

```php
$rules = [
    'name' => QueryableRules::like('max:64'),
];
```

`QueryableRules` 声明的验证规则默认包含 `nullable`。

如需自定义验证规则，可直接使用 `QueryableType` 声明查询规则：

```php
use Pin\Models\Queryable\QueryableType;

$rules = [
    'name' => [
        'required',
        'string',
        QueryableType::Like->asRule(),
    ],
];
```

### 字符串查询规则

可以使用字符串语法声明查询规则。

```php
$rules = [
    'name' => 'nullable|string|q:like',

    'keyword' => 'nullable|string|q:ns:id,username',

    'status' => 'nullable|array|q:IN',
];
```

::: info
`q:*` 规则仅用于声明查询方式，不会影响 Laravel 验证流程。
:::

::: tip
日常开发中推荐使用 `QueryableRules`：

```php
'keyword' => QueryableRules::ns('id,username'),
```

:::

### 在 Action 中使用

`Action` 中可直接使用已声明的查询规则：

```php
use App\Models\User;
use Pin\Actions\Action;
use Pin\Validation\QueryableRules as Queryable;

class ListUsersAction extends Action
{
    public function rules(): array
    {
        return [
            'keyword' => Queryable::ns('id,username,realname'),
            'status' => Queryable::inNumeric(),
            'created_at' => Queryable::range(),
        ];
    }

    public function handle()
    {
        return User::queryable($this->queryable())
            ->pagination();
    }
}
```

## 验证失败

Pin 的验证规则遵循 Laravel `ValidationRule` 接口。

验证失败时，会进入 Laravel 的 `ValidationException` 处理流程，并最终转换为统一的 API 响应：

```json
{
  "code": 422,
  "message": "用户名已经存在",
  "data": {
    "errors": {
      "username": ["用户名已经存在"]
    }
  }
}
```

如果需要返回业务错误码，可使用 `错误码|错误消息` 格式定义错误消息。

```php
new Unique(User::class)
    ->message('10000|用户名已经存在');

// 或者
$messages = [
    'username' => [
        'required' => '10000|用户名已经存在',
    ]
]
```

响应：

```json
{
  "code": 10000,
  "message": "用户名已经存在",
  "data": {
    "errors": {
      "username": ["10000|用户名已经存在"]
    }
  }
}
```
