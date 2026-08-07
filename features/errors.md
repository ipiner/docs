---
title: 错误码 | 核心功能
---

# 错误码

Pin 使用枚举定义错误码。

每个枚举 case 表示一个业务错误，关联对应的错误码、错误消息和 HTTP 状态码。

```php
<?php

declare(strict_types=1);

namespace App\Errors;

use Pin\Errors\Errorful;
use Pin\Errors\IError;
use Pin\Errors\Group;

#[Group('errors')]
enum Errors: string implements IError
{
    use Errorful;

    case UserDisabled = '10010|user_disabled';
    case OrderNotFound = '20404|404|order_not_found';
}
```

## 错误码定义

每个枚举 case 表示一个错误码，支持以下两种格式：

- `code|message`
- `code|status|message`

其中：

- `code` 表示业务错误码
- `status` 表示 HTTP 状态码
- `message` 表示错误消息

### 错误码

错误码用于唯一标识一个业务错误。

```php
case UserDisabled = '10010|user_disabled';
```

::: info
错误码通常为正整数。`10000` 以下的错误码由 Pin 内部使用，业务自定义错误码应使用 `10000` 及以上。
:::

### 错误消息

错误消息标识用于加载对应的翻译文本。

Pin 会根据当前语言环境获取翻译内容，并将其作为 API 响应中的错误提示信息。

自定义错误消息时，传入的内容同样会作为可翻译文本处理。

```php
case UserDisabled = '10010|user_disabled';
```

#### 翻译分组

默认情况下，错误消息不使用翻译分组。

可通过 `#[Group(...)]` 指定翻译分组。

翻译分组支持定义在枚举 case 或枚举类上。

优先级如下：

1. 当前错误枚举 case 上的 `#[Group]`
2. 错误枚举类上的 `#[Group]`

##### 定义在枚举类

使用应用语言文件 `lang/{locale}/errors.php`：

```php
use Pin\Errors\Group;

#[Group('errors')]
enum Errors: string implements IError
{
    case UserDisabled = '10010|user_disabled';
}
```

所有 case 默认使用 `errors` 分组。

##### 覆盖单个 case

如果某个错误需要使用不同的翻译分组，可以在 case 上单独指定：

```php
#[Group('pin::errors')]
case ServerError = '500|200|server_error';
```

#### 使用包语言文件

包语言文件通过命名空间指定：

```php
#[Group('package::errors')]
enum Errors: string implements IError
{
    //
}
```

对应：

```
lang/vendor/package/{locale}/errors.php
```

#### 禁用翻译

如果不需要翻译，可以指定：

```php
#[Group(false)]
enum Errors: string implements IError
{
    //
}
```

### HTTP 状态码

HTTP 状态码用于指定该错误对应的 HTTP 响应状态。

当未显式指定 HTTP 状态码时，Pin 会根据错误码自动推断：

- 错误码为有效的 HTTP 状态码时，直接作为响应状态码；
- 其他情况默认使用 `200`。

```php
case DeleteFailed = '1003|delete_failed';
case NotFound = '404|not_found';
case AccessDenied = '4030|403|access_denied';
```

## 错误码注册

### 自动注册

Pin 启动时会自动注册内置错误码，并扫描业务项目 `app/Errors` 目录下的错误码枚举。

默认命名空间为：

```php
App\Errors
```

目录结构应与命名空间保持一致。例如：

```text
app/Errors/Errors.php
```

对应：

```php
namespace App\Errors;

use Pin\Errors\Errorful;
use Pin\Errors\IError;

enum Errors: string implements IError
{
    use Errorful;
}
```

注册完成后，错误码即可通过全局错误注册中心进行查找。

### 手动注册

除了自动扫描外，也可以通过 `register()` 方法手动注册错误码。

```php
use Pin\Errors\ErrorRegistry;

ErrorRegistry::register([
    Errors::UserDisabled,
    UserErrors::TokenInvalid,
]);
```

## 错误码使用

### 获取业务错误码

通过 `code()` 方法获取业务错误码：

```php
case UserDisabled = '10010|user_disabled';

Errors::UserDisabled->code(); // 10010
```

### 获取错误消息

通过 `message()` 方法获取错误消息：

```php
Errors::UserDisabled->message();
```

`message()` 方法支持占位符替换：

```php
case OrderNotFound = '20404|404|订单:order不存在';

Errors::OrderNotFound->message(['order' => '2026123456']);
```

### 获取 HTTP 状态码 {#status-code}

通过 `statusCode()` 方法获取 HTTP 状态码：

```php
case DeleteFailed = '1003|delete_failed';
case NotFound = '404|not_found';
case AccessDenied = '4030|403|access_denied';

Errors::DeleteFailed->statusCode(); // 200
Errors::NotFound->statusCode();     // 404
Errors::AccessDenied->statusCode(); // 403
```

### 异常处理 {#exception}

错误码可以直接创建异常或抛出异常。

创建异常：

```php
$exception = Errors::UserDisabled->exception();
```

覆盖错误码或错误消息：

```php
$exception = Errors::UserDisabled
    ->exception('用户已禁用', 10010);
```

保留原始异常：

```php
$exception = Errors::UserDisabled
    ->exception(previous: $previous);
```

添加上下文：

```php
$exception = Errors::UserDisabled
    ->exception()
    ->withContext([...]);
```

如无需获取异常对象，通过 `throw()` 方法直接抛出异常：

```php
Errors::UserDisabled->throw();
```

::: info
`throw()` 和 `exception()` 支持相同的参数。
:::

## 错误码查找

Pin 支持根据错误码查找已注册的错误定义。

`get()` 返回对应的错误定义：

```php
Errors::get(3000)->message();
```

也可以直接获取错误消息：

```php
Errors::getMessage(3000);
```

::: info
如果指定的错误码不存在，`get()` 会返回默认的未知错误定义，而不会返回 `null`。
:::

## 错误码覆盖

错误码以 `code` 作为唯一标识。

当注册相同的错误码时，后注册的定义会覆盖之前的定义，可用于扩展或替换已有错误定义。

例如，Pin 内置的 `ServerError`：

```php
case ServerError = '500|server_error';
```

默认 HTTP 状态码为 `500`。

如果需要将该错误作为普通业务响应返回，可以重新定义相同错误码的错误，并覆盖原有定义：

```php
namespace App\Errors;

use Pin\Errors\Attributes\Group;

enum Errors: string implements IError
{
    #[Group('pin::errors')]
    case ServerError = '500|200|server_error';
}
```

::: tip
重新注册时，case 名称可以根据需要调整，不影响错误码的匹配。

```php
#[Group('pin::errors')]
case ErrServer = '500|200|server_error';
```

:::
