---
title: Fake 数据 | 测试
---

# Fake 数据

Pin Faker 根据验证规则生成测试数据，用于 API 测试、接口联调以及开发调试。

## 规则声明

Pin Faker 支持以下三种方式定义字段生成规则：

- 自动推导；
- 显式 `Fake`；
- `fake:*` 规则。

### 自动推导

当字段未指定生成规则时，Pin Faker 会根据字段的验证规则尝试推导生成方式。

目前支持以下规则：

- `string`：生成随机字符串。
- `integer`：生成随机整数。
- `email`：生成邮箱地址。
- `in`：从给定选项中随机选择一个值。
- `password`：生成请求传输格式的密码。

例如：

```php
protected function rules(): array
{
    return [
        'name' => 'required|string',
        'password' => 'required|string|fake:password',
        'email' => 'required|email',
        'age' => 'required|integer|min:18|max:60',
        'status' => 'required|integer|in:0,1',
        'website' => ['nullable', 'url'],
    ];
}
```

生成结果示例：

```php
[
    'name' => 'uGJb8fQpRz2xLmNc',
    'password' => 'OgyvOWgcTQkzxkoVbUmT5Ox+2K...',
    'email' => 'lueilwitz.darian@example.net',
    'age' => 28,
    'status' => 1,
]
```

### 显式声明

可以使用 `Fake` 指定字段的生成方式：

```php
use Pin\Faker\Fake;

protected function rules(): array
{
    return [
        'username' => ['required', 'string', Fake::string(12)],
        'age' => ['required', 'integer', Fake::integer(18, 60)],
        'status' => ['required', 'integer', Fake::in(0, 1)],
        'type' => ['required', Fake::enum(UserType::class)],
    ];
}
```

### `fake:*` 规则

也可以直接在验证规则中使用 `fake:*` 声明生成规则：

```php
protected function rules(): array
{
    return [
        'username' => 'required|string|fake:string,12',
        'age' => 'required|integer|min:18|max:60|fake:integer',
        'status' => 'required|integer|fake:in,0,1',
    ];
}
```

::: info
Fake 规则仅用于生成测试数据，不参与实际请求验证。
:::

## 基本用法

可通过 `Fake::generate()` 根据规则生成数据：

```php
use Pin\Faker\Fake;

$data = Fake::generate([
    'username' => 'required|string',
    'email' => 'required|email',
    'status' => 'required|integer|in:0,1',
]);
```

生成结果示例：

```php
[
    'username' => 'uGJb8fQpRz2xLmNc',
    'email' => 'lueilwitz.darian@example.net',
    'status' => 1,
]
```

如果验证规则定义在 Action 中，可以使用 [Action::fake()](/features/action#fake)：

```php
// CreateUserAction.php

protected function rules(): array
{
    return [
        'username' => 'required|string',
        'email' => 'required|email',
        'status' => 'required|integer|in:0,1',
    ];
}

$data = CreateUserAction::fake();
```

## 内置生成器

Pin Faker 内置了一组常用生成器，可通过 `Fake` 或 `fake:*` 使用。

### string

生成随机字符串，默认长度为 `24`。

```php
// 显式声明
'name' => 'required|string|fake:string'
'name' => ['required', 'string', Fake::string()]

// 自动推导
'name' => 'required|string'
```

指定长度：

```php
// 显式声明
'name' => 'required|string|fake:string,32'
'name' => ['required', 'string', Fake::string(32)]

// 自动推导
'name' => 'required|string|max:32'
```

::: info
自动推导时，如果存在 `max` 规则，则使用 `max` 作为字符串长度。
:::

### integer

生成随机整数，默认范围为 `1` ~ `10000`。

```php
// 显式声明
'age' => 'required|integer|fake:integer'
'age' => ['required', 'integer', Fake::integer()]

// 自动推导
'age' => 'required|integer'
```

自动推导时，会优先读取 `min` 和 `max`：

```php
'age' => 'required|integer|min:18|max:60'
```

以上规则会生成 `18` 到 `60` 之间的随机整数。

未指定 `min` 或 `max` 时，将分别使用默认值 `1` 和 `10000`。

### in

从给定选项中随机返回一个值。

```php
// 显式声明
'status' => 'required|fake:in,0,1'
'status' => ['required', Fake::in('0', '1')]

// 自动推导
'status' => 'required|in:0,1'
```

以上规则返回字符串 `'0'` 或 `'1'`。

如果字段包含 `integer` 规则，则返回整数：

```php
'status' => 'required|integer|in:0,1'
```

也可以直接传入整数：

```php
'status' => ['required', Fake::in(0, 1)]
```

### enum

枚举类型需要显式声明。

```php
use Pin\Faker\Fake;
use Pin\Validation\Rules\Enum;

'status' => [
    'required',
    new Enum(UserStatus::class),
]
```

例如：

```php
enum UserStatus: string
{
    case Enabled = 'enabled';
    case Disabled = 'disabled';
}
```

生成结果为 `enabled` 或者 `disabled`。

### password

可以使用 `fake:password` 或 `Fake::password()` 生成请求传输格式的密码：

```php
'password' => 'required|fake:password'

'password' => ['required', Fake::password()]
```

`Fake::password()` 默认使用 `test@123` 作为明文密码生成请求值。

如果需要指定明文密码，可以传入对应值：

```php
'password' => 'required|fake:password,123456'

'password' => ['required', Fake::password('123456')]
```

此时会使用 `123456` 生成请求传输格式的密码。

## FakerPHP 生成器

Pin 未内置的 `Fake` 方法会调用 FakerPHP 提供的生成器。

例如：

```php
$rules = [
    'name' => ['required', Fake::name()],
    'email' => ['required', Fake::safeEmail()],
    'city' => ['required', Fake::city()],
    'amount' => ['required', Fake::randomFloat(2, 1, 999)],
];
```

以上调用会对应到：

```php
fake()->name();
fake()->safeEmail();
fake()->city();
fake()->randomFloat(2, 1, 999);
```

## 闭包生成器

对于需要自定义生成逻辑的字段，可使用 `Fake::make()`：

```php
use Pin\Faker\Fake;
use Pin\Faker\RuleBag;

$rules = [
    'slug' => [
        'required',
        'string',
        Fake::make(
            fn (RuleBag $rules) => 'post-'.date('Ymd'),
        ),
    ],
];
```

闭包会接收当前字段的 `RuleBag`：

```php
Fake::make(
    fn (RuleBag $rules, string $prefix, int $id) => "{$prefix}-{$id}",
    ['user', 100],
);
```

额外参数会按顺序传递给闭包。

## Nullable

生成数据时，支持根据 `nullable` 规则生成 `null`。

例如：

```php
'nickname' => 'nullable|string|max:20'
```

默认有 `20%` 的概率生成 `null`。

可通过规则参数调整概率：

```php
'nickname' => 'nullable:50|string|max:20'
```

以上规则表示有 `50%` 的概率生成 `null`。

## 字段忽略

### 未匹配生成规则

如果字段没有显式生成规则，且无法根据验证规则自动推导，则会被忽略。

例如：

```php
[
    'missing' => 'sometimes',
]

```

### Wildcard 字段

包含 `*` 的字段也会被忽略。

例如：

```php
[
    'roles.*' => 'integer'
]
```

## 扩展

### 注册 Macro

`Fake` 使用 Laravel `Macroable`，支持注册自定义生成器。

```php
use Pin\Faker\Fake;

Fake::macro('mobile', function () {
    return Fake::make(
        fn () => '138'.random_int(10000000, 99999999),
    );
});
```

注册后，可以直接使用：

```php
'mobile' => [
    'required',
    Fake::mobile(),
]
```

### 注册推导器

可以为自定义 Validation Rule 注册自动推导逻辑。

```php
use Pin\Faker\Fake;
use Pin\Faker\RuleBag;

Fake::registerInfer('date', function (RuleBag $rules) {
    return Fake::make(
        fn (RuleBag $rules) => date(
            $rules->parameter('format') ?? 'Y-m-d'
        ),
    );
});
```

注册后，可以根据对应验证规则生成数据：

```php
Fake::generate([
    'birthday' => 'date|format:Y/m/d',
]);
```

### 使用闭包

对于局部使用的自定义字段，可以直接使用闭包：

```php
'request_id' => [
    'required',
    Fake::make(fn () => (string) Str::uuid()),
]
```

需要复用相同生成逻辑时，可以将其封装为 Macro 或自动推导器。
