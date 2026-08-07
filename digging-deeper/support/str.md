## 字符串

### 字符串分割

`Str::explode()` 用于按指定分隔符分割字符串，并自动去除元素两侧的空白，同时过滤空值。

默认使用 `,` 分割：

```php
use Pin\Support\Str;

Str::explode(' foo, bar, ,');    // ['foo', 'bar']
Str::explode(null);             // []
Str::explode(' ');              // []
```

指定分割符：

```php
Str::explode('foo|bar', '|'); // ['foo', 'bar']
```

转换为整数数组：

```php
Str::explodeToIntegers('-1,2,3'); // [-1, 2, 3]
```

::: warning
`explodeToIntegers()` 使用 `intval()` 进行转换。

```php
Str::explodeToIntegers('1,1a,a');
// [1, 1, 0]
```

:::

### 字符串转换

`Str::string()` 将给定值转换为字符串。

对于枚举：

- `BackedEnum`：返回 `value`。
- `UnitEnum`：返回 `name`。

```php
enum Status: string
{
    case Enabled = 'enabled';
}

enum Role
{
    case Admin;
}

Str::string(Status::Enabled); // enabled
Str::string(Role::Admin);     // Admin
```

其他类型通过 `(string)` 转换为字符串。

```php
Str::string('hello'); // hello
Str::string(123);     // "123"
Str::string(true);    // "1"
Str::string(null);    // ""
```

### 占位符替换

`Str::format()` 用于替换字符串中的占位符。

默认使用 `{}` 占位符：

```php
use Pin\Support\Str;

Str::format(
    '{name} has {count} items',
    [
        'name' => 'Pin',
        'count' => 3,
    ]
);

// Pin has 3 items
```

自定义占位符：

```php
Str::format(
    'Hello :name',
    [
        'name' => 'Pin',
    ],
    ':'
);

// Hello Pin
```

::: info
占位符规则：

- 双字符：`{key}` / `%key%`
- 单字符：`:key`

:::

### UTF-8 判断

`Str::isValidUtf8()` 用于判断字符串是否为有效的 UTF-8 编码。

```php
use Pin\Support\Str;

Str::isValidUtf8($value);
```

### 脱敏处理 {#str-mask-sensitive}

`Str::maskSensitive()` 用于根据字段名对敏感数据进行脱敏。

```php
use Pin\Support\Str;

Str::maskSensitive('secret123'); // sec******
```

可以传入字段名，用于判断是否需要脱敏：

```php
Str::maskSensitive('secret123', 'password'); // sec******
Str::maskSensitive('secret123', 'name');     // secret123
```

默认规则：

| 字段名                          | 处理方式 |
| ------------------------------- | -------- |
| 未提供 (`null`)                 | 脱敏处理 |
| 包含 `password`（不区分大小写） | 脱敏处理 |
| 其他                            | 保持原值 |

默认脱敏规则会保留前 3 个字符，并追加 `******`。

可通过 `setSensitiveValueMasker()` 自定义脱敏处理逻辑，回调中的 `$key` 参数表示当前字段名：

```php
Str::setSensitiveValueMasker(function (mixed $value, ?string $key): mixed {
    return match ($key) {
        'email' => substr((string) $value, 0, 3).'***@***',
        'phone' => substr((string) $value, 0, 3).'****'.substr((string) $value, -4),
        default => '******',
    };
});

Str::maskSensitive('test@example.com', 'email'); // tes***@***

Str::maskSensitive('13800138000', 'phone'); // 138****8000
```
