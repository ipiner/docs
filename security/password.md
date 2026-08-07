---
title: 密码 | 安全
---

# 密码

Pin 的 `Password` 模块用于处理应用中的密码转换、存储和校验。

它提供密码编码、请求密码解析、密码哈希和密码验证等能力，用于规范应用中的密码处理方式。

## 密码处理

### `encode()`

`encode()` 用于将用户输入转换为标准密码编码。

```php
use Pin\Support\Facades\Password;

$encoded = Password::encode('secret');
```

返回值为 `32` 位大写编码字符串。

该编码用于密码后续的传输、存储和校验流程。

### `encodeToRequest()` {#encodeToRequest}

`encodeToRequest()` 用于将密码转换为接口请求格式。

```php
use Pin\Support\Facades\Password;

$requestPassword = Password::encodeToRequest('secret');
```

服务端可通过 `decodeFromRequest()` 将请求密码解析为标准密码编码。

#### 前端实现

前端提交密码时，需要生成与 `Password::encodeToRequest()` 一致的请求密码格式。

前端应按照相同规则完成密码编码和请求密码转换：

```ts
import md5 from "crypto-js/md5";
import { encodeByRandomKey } from "@/utils/crypt";

export function encodePassword(password: string): string {
  return md5(password.toUpperCase()).toString().toUpperCase();
}

export function encodePasswordToRequest(password: string): string {
  return encodeByRandomKey(encodePassword(password));
}
```

登录接口示例：

```ts
await request.post("/api/login", {
  account: form.account,
  password: encodePasswordToRequest(form.password),
});
```

修改密码接口中，密码相关字段也需要转换：

```ts
await request.post("/api/profile/password", {
  current_password: encodePasswordToRequest(form.currentPassword),
  new_password: encodePasswordToRequest(form.newPassword),
  new_password_confirmation: encodePasswordToRequest(form.confirmPassword),
});
```

:::warning
前端实现必须与 `Password::encodeToRequest()` 使用相同规则，否则服务端无法正确解析请求密码。
:::

### `decodeFromRequest()`

`decodeFromRequest()` 用于将请求密码解析为标准密码编码。

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

## 中间件

Pin 提供 `DecodePassword` 中间件，用于解析请求中的密码字段。

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

解析后，业务层获取的是标准密码编码。

### 本地调试

在非生产环境中，可以使用 `plain:` 前缀提交密码，用于接口调试。

例如：

```text
plain:secret
```

该格式会通过 `Password::encode()` 转换为标准密码编码。

## 密码规则验证

`PasswordRule` 用于验证密码是否符合指定策略。

```php
use Pin\Password\PasswordRule;

'password' => [
    'required',
    new PasswordRule(),
],
```

默认规则包括：

- 长度不少于 8 位；
- 长度不超过 32 位；
- 不允许包含空白字符；
- 不允许包含过长的连续字符；
- 不允许包含过长的重复字符。

### 规则配置

`PasswordRule` 支持通过链式方法调整密码规则。

| 方法                         | 作用                   | 默认值 |
| ---------------------------- | ---------------------- | ------ |
| `min(8)`                     | 设置最小长度           | `8`    |
| `max(32)`                    | 设置最大长度           | `32`   |
| `allowWhitespace()`          | 允许空白字符           | 禁止   |
| `maxSequentialCharacters(5)` | 限制连续字符数量       | `5`    |
| `maxRepeatedCharacters(5)`   | 限制重复字符数量       | `5`    |
| `numbers()`                  | 必须包含数字           | -      |
| `letters()`                  | 必须包含字母           | -      |
| `lowers()`                   | 必须包含小写字母       | -      |
| `uppers()`                   | 必须包含大写字母       | -      |
| `mixedCase()`                | 必须同时包含大小写字母 | -      |
| `symbols()`                  | 必须包含特殊字符       | -      |
| `requiredCharacterTypes(2)`  | 要求字符类型数量       | -      |

### 策略组合

默认情况下，`PasswordRule` 提供基础密码验证：

```php
use Pin\Password\PasswordRule;

'password' => [
    'required',
    new PasswordRule(),
],
```

如果需要更严格的密码策略，可以组合多个规则：

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

也可以指定必须包含的字符类型：

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
