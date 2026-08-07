## 异常堆栈 {#stack-trace}

Pin 支持记录异常堆栈，并可根据异常类型和调用帧规则控制堆栈内容。

### 配置

异常堆栈配置位于 `config/logging.php`：

```php
'stack_trace' => [
    'enabled' => env('LOG_STACK_TRACE_ENABLED', false),
    'include_exceptions' => [],
    'exclude_exceptions' => [],
    'max_frames' => 10,
    'include_frames' => [],
    'exclude_frames' => [
        'Illuminate' => 'Illuminate',
    ],
],
```

配置示例：

::: code-group

```php [仅保留业务代码调用帧]
'stack_trace' => [
    'enabled' => true,
    'max_frames' => 20,
    'include_frames' => [
        '/app/',
    ],
    'exclude_frames' => [
        'vendor',
    ],
],
```

```php [仅记录指定异常类型]
'stack_trace' => [
    'enabled' => true,
    'include_exceptions' => [
        App\Exceptions\PaymentException::class,
    ],
],
```

```php [使用正则匹配调用帧]
// 该配置仅保留匹配 `/app/Services/` 或 `/app/Actions/` 的调用帧。

'stack_trace' => [
    'enabled' => true,
    'include_frames' => [
        '#/app/(Services|Actions)/#',
    ],
],
```

:::

### 记录规则

异常堆栈默认关闭：

```php
'enabled' => env('LOG_STACK_TRACE_ENABLED', false)
```

启用后：

- 实现 `SkipTrace` 的异常不会记录堆栈；
- 命中 `exclude_exceptions` 的异常不会记录堆栈；
- `include_exceptions` 为空时，记录所有未排除的异常；
- `include_exceptions` 不为空时，仅记录指定异常类型。

例如：

```php
'stack_trace' => [
    'enabled' => true,
    'include_exceptions' => [
        App\Exceptions\PaymentException::class,
    ],
    'exclude_exceptions' => [
        Illuminate\Validation\ValidationException::class,
    ],
],
```

表示仅记录 `PaymentException` 及其子类的堆栈信息，`ValidationException` 会被排除。

::: tip
当异常同时匹配 `include_exceptions` 和 `exclude_exceptions` 时，以排除规则为准。
:::

### 跳过堆栈记录

对于无需记录堆栈的异常，可以实现 `SkipTrace` 接口：

```php
use Pin\Log\SkipTrace;
use RuntimeException;

class BusinessNoticeException extends RuntimeException implements SkipTrace
{
}
```

### 调用帧

调用帧示例：

```text
#0/25 /path/app/Services/UserService.php:42 App\Services\UserService->create
```

| 内容            | 说明                    |
| --------------- | ----------------------- |
| `#0/25`         | 当前调用帧序号 / 总帧数 |
| `file:line`     | 文件路径和行号          |
| `class->method` | 调用类和方法            |

保留数量由 `max_frames` 控制：

```php
'max_frames' => 10
```

### 调用帧过滤

可以通过 `include_frames` 和 `exclude_frames` 控制保留的调用帧：

```php
'include_frames' => [],
'exclude_frames' => [
    'Illuminate' => 'Illuminate',
],
```

过滤匹配以下字段：

| 字段       | 说明     |
| ---------- | -------- |
| `file`     | 文件路径 |
| `class`    | 调用类名 |
| `function` | 方法名   |

规则支持：

| 类型       | 说明                   |
| ---------- | ---------------------- |
| 普通字符串 | 对字段内容进行包含匹配 |
| `#` 开头   | 使用正则表达式匹配     |
