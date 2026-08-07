---
title: 异常处理 | 核心功能
---

# 异常处理

Pin 基于 Laravel 默认异常处理机制，对应用异常进行统一处理，并规范 API 响应和日志记录。

## 异常处理器

Pin 扩展 Laravel 应用初始化阶段的 `withExceptions()` 配置能力，默认将应用异常处理器绑定为 `Pin\Exceptions\Handler`。

可通过以下方式指定自定义异常处理器，实现对异常报告、渲染等行为的精细控制：

```php
namespace App\Exceptions;

class Handler extends \Pin\Exceptions\Handler
{
    //
}

```

```php
use App\Exceptions\Handler;

->withExceptions(Handler::class, function (Exceptions $exceptions) {
    //
})
```

::: info

Pin 保留 Laravel 原生 `withExceptions()` 配置方式，异常配置逻辑仍由 Laravel `Exceptions` 管理。

:::

## 业务异常

Pin 提供 `Pin\Exceptions\Exception` 作为统一业务异常基类。

### 异常构建

Pin 异常兼容 PHP 原生异常构造方式，并扩展支持基于[错误码](/features/errors)创建异常。

```php
use Pin\Exceptions\Exception;

class BusinessException extends Exception
{
    //
}
```

使用原生方式构建：

```php
throw new BusinessException('用户已禁用', 10010, $previous);
```

使用错误码构建：

```php
throw new BusinessException(Errors::UserDisabled, 0, $previous);
```

传入错误码时，Pin 会自动映射错误消息、业务错误码和 HTTP 状态码。

等价于：

```php
throw new BusinessException(
    Errors::UserDisabled->message(),
    Errors::UserDisabled->code(),
    $previous
);
```

其中 HTTP 状态码会通过错误码的 [statusCode()](/features/errors.md#status-code) 自动设置。

### 异常响应

#### 响应消息

Pin 会根据异常类型和应用调试模式确定 API 响应中的异常消息。

可以通过 `withResponseMessage()` 方法设置 API 响应消息。

```php
throw new BusinessException('Payment timeout', 90000)
    ->withResponseMessage('支付服务暂时不可用，请稍后再试');
```

API 响应：

```php
{
    "code": 90000,
    "message": "支付服务暂时不可用，请稍后再试",
    "data": null,
}
```

::: info
通过 `withResponseMessage()` 设置的消息仅用于 API 响应返回，不会修改异常原始 `message`。异常报告和日志记录仍使用原始消息。
:::

#### HTTP 状态码

Pin 会根据异常类型和错误码定义确定 API 响应的 HTTP 状态码。

可以通过 `withStatusCode()` 方法覆盖默认状态码：

```php
throw new BusinessException('Payment timeout', 90000)
    ->withStatusCode(503);
```

### 异常上下文

通过 `withContext()` 添加结构化上下文，用于异常报告和日志记录。

```php
throw new Exception(Errors::UserDisabled)
    ->withContext([
        'uid' => $uid,
    ]);
```

异常记录中会包含附加上下文：

```json
{
  "uid": 1001
}
```

### 异常日志

#### 异常报告

Pin 默认仅记录 HTTP 状态码 `>= 500` 的异常报告。

可通过 `withReport()` 显式控制：

```php
throw (new Exception('服务不可用'))
    ->withReport(false);
```

#### 日志级别

Pin 默认使用应用配置的日志级别记录异常。

通过 `withLogLevel()` 方法指定异常记录时使用的日志级别：

```php
throw (new Exception('服务不可用'))
    ->withLogLevel('warning');
```
