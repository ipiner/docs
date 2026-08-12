---
title: 加解密 | 安全
---

# 加解密

Pin 提供 AES 对称加密、RSA 非对称加密，以及请求字段自动解密能力。

## 配置

配置文件 `config/pin/crypt.php`。

## AES 对称加密 {#aes}

使用配置密钥：

```php
use Pin\Support\Facades\Aes;

$cipher = Aes::encrypt('payload');
$plain = Aes::decrypt($cipher);
```

使用随机密钥：

```php
$cipher = Aes::encrypt('payload', true);
$plain = Aes::decrypt($cipher);
```

## RSA 非对称加密 {#rsa}

使用配置密钥：

```php
use Pin\Support\Facades\Rsa;

$encrypted = Rsa::encrypt('payload');
$decrypted = Rsa::decrypt($encrypted);

$signature = Rsa::sign('payload');
$verified = Rsa::verify('payload', $signature);
```

指定密钥：

```php
$encrypted = Rsa::encrypt('payload', $publicKey);
$decrypted = Rsa::decrypt($encrypted, $privateKey);

$signature = Rsa::sign('payload', $privateKey);
$verified = Rsa::verify('payload', $signature, $publicKey);
```

## 请求字段自动解密

`Pin\Crypt\Middleware\Decrypt` 中间件可自动解密指定请求字段。

```php
use Pin\Crypt\Middleware\Decrypt;

#[Middleware(Decrypt::class.':password')]
case Create = 'POST:/api/users';
```

经过中间件后，控制器或 Action 获取到的是解密后的值。

### 明文调试

在非生产环境中，可以使用 `plain:` 前缀直接传递明文：

```text
plain:123456
```

经过中间件后，请求值为：

```text
123456
```

:::warning
`plain:` 仅用于本地开发和接口调试，生产环境不会启用。
:::
