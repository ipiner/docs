---
title: Token（令牌）| 安全
---

# Token（令牌）

Token 用于签发和解析应用令牌。

## 基础用法

通过 `Pin\Support\Facades\Token` 门面访问 Token API。

### 签发 Token

使用数组：

```php
use Pin\Support\Facades\Token;

$encoded = Token::encode([
    'uid' => 1001,
    // 更多业务字段
]);
```

使用 `TokenPayload`：

```php
use Pin\Support\Facades\Token;
use Pin\Token\TokenPayload;

$payload = new TokenPayload([
    'uid' => 1001,
]);
$encoded = Token::encode($payload);
```

如需使用其他驱动，可通过 `driver()` 指定：

```php
$encoded = Token::driver('jwt')->encode($payload);
```

### 解析 Token

```php
$token = Token::decode($encoded);

$uid = $token->uid; // 1001
```

指定驱动解析：

```php
$token = Token::driver('jwt')->decode($encoded);
```

### 过期时间

Token 的过期时间由当前驱动配置控制。

可在签发时指定有效期，单位为秒：

```php
Token::encode(['uid' => 1001], 3600);
```

指定过期时间（Unix 时间戳）：

```php
$token = Token::encode([
    'uid' => 1001,
    'exp' => 1785636433,
]);
```

指定签发时间和有效期（秒）：

```php
$token = Token::encode([
    'uid' => 1001,
    'iat' => 1785636433,
    'expires' => 3600,
]);
```

::: info
驱动会根据签发时间计算最终的 `exp`。
:::

## 驱动

驱动定义 Token 的签发和解析方式。

Pin 提供多个内置驱动，可根据应用需求选择不同策略。

### AES 驱动

AES 驱动是默认的 Token 驱动，使用 [AES 加密](/security/crypt.md#aes) 进行加解密。

AES 驱动默认不设置过期时间，如需限制 Token 有效期，可在签发时指定

```php
Token::encode($payload, 3600);
```

::: info
AES 驱动固定使用 `config('pin.crypt.key')` 和 `config('pin.crypt.iv')` 进行加解密，而非随机密钥。
:::

### JWT 驱动

JWT 驱动基于 [`firebase/php-jwt`](https://github.com/firebase/php-jwt) 实现。

使用前需要安装依赖：

```bash
composer require firebase/php-jwt
```

```php
$encoded = Token::driver('jwt')->encode([
    'uid' => 1001,
    'iat' => 1785636433,
    'expires' => 3600,
]);

$token = Token::driver('jwt')->decode($encoded);
```

### Session 驱动

Session 驱动通过服务端状态管理 Token 生命周期。

与无状态驱动不同，Session 驱动支持主动失效和滑动续期。

#### 配置

`pin.token.drivers.session` 用于配置 Session 驱动：

主要配置项：

| 配置             | 说明                     |
| ---------------- | ------------------------ |
| `expires`        | Token 默认有效期（秒）   |
| `refresh_before` | 自动续期窗口（秒）       |
| `max_age`        | Token 最大生命周期（秒） |

::: info

- 当 Token 剩余有效时间小于 `refresh_before` 时，Session 驱动会自动延长有效期。
- `max_age` 用于限制 Token 从签发开始的最大存活时间，即使持续访问也不会超过该时间。
- Session 驱动默认使用配置中的 `expires` 作为 Token 有效期。

:::

#### 使用

```php
$encoded = Token::driver('session')->encode([
    'uid' => 1001,
]);
```

指定缓存 key：

```php
$encoded = Token::driver('session')->encode([
    'uid' => 1001,
    'jti' => 'auth-1001',
]);
```

#### 注销

```php

Token::driver('session')->forget('auth-1001');

// 或者
$token = Token::driver('session')->decode($encoded);
Token::driver('session')->forget($token);
```

### 自定义驱动

可通过 `Token::extend()` 注册自定义自定义驱动。

```php
use Pin\Support\Facades\Token;

Token::extend('custom', function ($app, array $config) {
    return new Pin\Token\TokenFactory(
        new CustomTokenDriver($config)
    );
});
```

自定义驱动需要实现 `Pin\Token\Contracts\TokenDriver`：

```php
interface TokenDriver
{
    public function encode(TokenPayload $payload, ?int $expires = null): string;
    public function decode(string $encodedPayload): Token;
}
```

注册后，可通过 `driver()` 使用：

```php
$encoded = Token::driver('custom')->encode([
    'uid' => 1001,
]);

$token = Token::driver('custom')->decode($encoded);
```

也可在配置文件中将自定义驱动设置为默认：

```php
// config/pin/token.php

return [
    'default' => 'custom',

    'drivers' => [
        'custom' => [
            'driver' => 'custom',
        ],
    ],
];
```

配置后，可直接使用默认驱动：

```php
$encoded = Token::encode([
    'uid' => 1001,
]);

$token = Token::decode($encoded);
```
