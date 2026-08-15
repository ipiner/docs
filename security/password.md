---
title: 密码 | 安全
---

# 密码

Pin 的 `Password` 模块用于处理应用中的密码转换、存储和校验。

它提供密码编码、请求密码解析、密码哈希和密码验证等能力，用于规范应用中的密码处理方式。

## 密码处理

Pin 将密码处理分为**密码编码、请求转换和密码存储**三个阶段。

### `encode()`

`encode()` 用于将用户输入转换为标准密码编码。

当前使用 `MD5` 对密码进行编码，并将结果转换为大写：

```php
use Pin\Support\Facades\Password;

$encoded = Password::encode('secret');
```

返回值为 `32` 位大写编码字符串。

标准密码编码用于后续的请求转换、密码存储和密码校验。

::: info
`encode()` 用于统一密码处理格式，不用于密码存储。密码存使用 `hash()`。
:::

### `encodeToRequest()` {#encodeToRequest}

`encodeToRequest()` 用于将标准密码编码转换为接口请求格式。

请求密码使用 [AES 加密](/security/crypt#aes)，并采用随机密钥生成请求值：

```php
use Pin\Support\Facades\Password;

$requestPassword = Password::encodeToRequest('secret');
```

服务端可通过 `decodeFromRequest()` 将请求密码解析为标准密码编码。

#### 前端实现

前端提交密码时，需要生成与 `Password::encodeToRequest()` 一致的请求密码格式。

::: code-group

```ts [password.ts]
import { encrypt, md5 } from "./crypt";

export function encodePassword(plain: string) {
  const encoded = md5(plain.toUpperCase()).toUpperCase();

  return encrypt(encoded);
}
```

```ts [crypt.ts]
import AES from "crypto-js/aes";
import { parse } from "crypto-js/enc-utf8";
import MD5 from "crypto-js/md5";
import pkcs7 from "crypto-js/pad-pkcs7";

import { random } from "./string";

export function encrypt(encoded: string) {
  const key = random();
  const s = parse(key);

  return (
    random(1, "ABCDEFGHIJKLMNOPQRSTUVWXYZ") + // 表示随机密钥
    key +
    AES.encrypt(encoded, s, {
      iv: s,
      padding: pkcs7,
    }).toString()
  );
}

export function md5(plain: string) {
  return MD5(plain).toString();
}
```

```ts [string.ts]
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function random(n = 16, chars = CHARS) {
  const len = chars.length;
  let result = "";
  for (let i = 0; i < n; i++) {
    result += chars.charAt(Math.floor(Math.random() * len));
  }

  return result;
}
```

:::

登录接口示例：

```ts
await request.post("/api/login", {
  account: form.account,
  password: encrypt(form.password),
});
```

修改密码接口中，密码相关字段也需要转换：

```ts
await request.post("/api/profile/password", {
  current_password: encodePassword(form.currentPassword),
  new_password: encodePassword(form.newPassword),
  new_password_confirmation: encodePassword(form.confirmPassword),
});
```

### `decodeFromRequest()`

`decodeFromRequest()` 用于解析请求密码，将请求中的密码还原为标准密码编码。

解析过程与 `encodeToRequest()` 相反：

```php
use Pin\Support\Facades\Password;

$encoded = Password::decodeFromRequest($requestPassword);
```

### `hash()` 和 `check()`

`hash()` 用于生成密码存储值，`check()` 用于验证密码是否匹配。

```php
use Pin\Support\Facades\Password;

$encoded = Password::decodeFromRequest(
    $request->input('password')
);

$hash = Password::hash($encoded, $user->salt);

$valid = Password::check(
    $encoded,
    $user->salt,
    $user->password
);
```

### 自定义密码处理

业务系统可以继承 `Pin\Password\Password`，根据现有密码处理规则覆盖默认实现。

例如，使用 `MD5` 作为密码编码，并直接将编码结果作为请求密码：

```php
<?php

declare(strict_types=1);

namespace App;

use Override;
use Pin\Errors\Errors;
use Pin\Password\PasswordException;

class Password extends \Pin\Password\Password
{
    #[Override]
    public function decodeFromRequest(string $requestPassword): string
    {
        if ($this->isValid($requestPassword)) {
            return $requestPassword;
        }

        throw new PasswordException(
            "请求密码异常[{$requestPassword}]",
            Errors::PasswordInvalid->code(),
        );
    }

    #[Override]
    public function encode(string $plain): string
    {
        return md5($plain);
    }

    #[Override]
    public function encodeToRequest(string $plain): string
    {
        return md5($plain);
    }

    #[Override]
    protected function isValid(string $password): bool
    {
        return strlen($password) === 32 && $password === strtolower($password);
    }
}

```

然后将业务实现绑定到 Pin 的 `Password` 服务，以覆盖默认实现：

```php
namespace App\Providers;

use App\Password;
use Pin\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->app->singleton(\Pin\Password\Password::class, Password::class);

        //
    }
}

```

完成绑定后，仍通过 Pin 提供的 `Password` Facade 使用密码服务，无需修改业务代码：

```php
use Pin\Support\Facades\Password;

$encoded = Password::decodeFromRequest(
    $request->input('password')
);

$hash = Password::hash($encoded, $user->salt);

$valid = Password::check(
    $encoded,
    $user->salt,
    $user->password
);
```

前端也需要按照业务实现的密码处理规则生成请求密码，确保与后端的 `encodeToRequest()` 和 `decodeFromRequest()` 保持一致。

例如，上述实现使用 `MD5` 作为请求密码：

```ts
import md5 from "crypto-js/md5";

export function encrypt(plain: string): string {
  return md5(plain).toString();
}
```

## 中间件

Pin 提供 `DecodePassword` 中间件，用于自动解析请求中的密码字段。

```php
use Pin\Password\Middleware\DecodePassword;

#[Middleware(DecodePassword::class)]
case Create = 'POST:/api/users';
```

默认处理以下字段：

- `password`
- `current_password`
- `new_password`
- `password_confirmation`

中间件会将请求密码解析为标准密码编码，并将结果传递给后续业务逻辑。

例如：

```json
{
  "password": "request_password"
}
```

经过中间件处理后，业务层获取的是标准密码编码。

### 本地调试

在非生产环境 或 [API 来源](/features/request.md#isFromApiDocument) 中，可以使用 `plain:password` 格式提交密码，用于接口调试。

例如：

```text
plain:secret
```

该格式会通过 `Password::encode()` 转换为标准密码编码。

## 密码规则验证

`PasswordRule` 用于验证密码是否符合指定的密码策略。

密码规则主要从以下几个方面进行限制：

- **长度**：限制密码的最小和最大长度；
- **字符组成**：要求密码包含数字、字母、大小写字母或特殊字符等指定类型；
- **连续字符**：限制连续递增或递减字符的数量，例如 `123456`、`abcdef`；
- **重复字符**：限制连续重复字符的数量，例如 `aaaaaa`、`111111`；
- **空白字符**：默认禁止密码包含空格、制表符等空白字符。

### 默认规则

不指定额外规则时，`PasswordRule` 使用以下默认策略：

| 规则               | 默认值      |
| ------------------ | ----------- |
| 最小长度           | `8`         |
| 最大长度           | `32`        |
| 空白字符           | 禁止        |
| 连续字符           | 最多 `5` 个 |
| 重复字符           | 最多 `5` 个 |
| 必须包含的字符类型 | 无          |

因此：

```php
use Pin\Password\PasswordRule;

'password' => [
    'required',
    new PasswordRule(),
],
```

表示密码至少 **8 位**、最多 **32 位**，不能包含空白字符，并限制连续字符和重复字符；**默认不要求密码必须同时包含数字、字母或特殊字符**。

例如：

```text
12345678
```

不会因为缺少字母而被 `PasswordRule` 拒绝。

如果应用需要更严格的密码策略，可以进一步指定字符类型。

### 字符类型

`PasswordRule` 支持以下字符类型：

| 方法                        | 要求                   |
| --------------------------- | ---------------------- |
| `numbers()`                 | 必须包含数字           |
| `letters()`                 | 必须包含字母           |
| `lowers()`                  | 必须包含小写字母       |
| `uppers()`                  | 必须包含大写字母       |
| `mixedCase()`               | 必须同时包含大小写字母 |
| `symbols()`                 | 必须包含特殊字符       |
| `requiredCharacterTypes(2)` | 至少包含 2 种字符类型  |

例如：

```php
use Pin\Password\PasswordRule;

'password' => [
    'required',
    (new PasswordRule())
        ->numbers()
        ->letters()
        ->symbols(),
],
```

要求密码同时包含：

- 数字；
- 字母；
- 特殊字符。

### 长度

使用 `min()` 和 `max()` 设置密码长度：

```php
(new PasswordRule())
    ->min(10)
    ->max(32)
```

例如：

```text
1234567890
```

满足最小长度为 `10` 的要求。

### 连续字符

`maxSequentialCharacters()` 用于限制连续字符。

例如：

```php
(new PasswordRule())
    ->maxSequentialCharacters(4)
```

用于限制类似：

```text
12345
abcde
```

这样的连续字符。

### 重复字符

`maxRepeatedCharacters()` 用于限制连续重复字符。

例如：

```php
(new PasswordRule())
    ->maxRepeatedCharacters(3)
```

用于限制类似：

```text
aaaa
1111
```

这样的重复字符。

### 空白字符

默认情况下，密码不允许包含空白字符。

如果需要允许空格或其他空白字符，可以使用：

```php
(new PasswordRule())
    ->allowWhitespace()
```

### 策略组合

可以组合多个规则，形成应用所需的密码策略：

```php
use Pin\Password\PasswordRule;

'password' => [
    'required',
    (new PasswordRule())
        ->min(10)
        ->max(32)
        ->requiredCharacterTypes(2)
        ->maxSequentialCharacters(4)
        ->maxRepeatedCharacters(3),
],
```

也可以直接指定字符类型：

```php
use Pin\Password\PasswordRule;

'password' => [
    'required',
    (new PasswordRule())
        ->numbers()
        ->letters()
        ->symbols(),
],
```

### 错误码

`PasswordRule` 默认返回带错误码前缀的验证消息，以便与 Pin 的错误处理机制保持一致。

如果只需要返回验证文本，可以关闭错误码：

```php
use Pin\Password\PasswordRule;

new PasswordRule(false);
```

```

```
