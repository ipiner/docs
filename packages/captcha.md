---
title: 验证码 | 扩展包
---

# 验证码

[ipiner/captcha](https://github.com/ipiner/captcha) 用于生成图形验证码，并提供统一的服务端校验流程。

## 安装

```bash
composer require ipiner/captcha
```

## 配置

验证码配置文件为 `config/pin/captcha.php`。

可按需发布配置：

```bash
php artisan vendor:publish --tag=pin-captcha-config
```

## 验证码生成

`Captcha::generate()` 用于生成验证码及校验所需的 `token`。

```php
use Pin\Captcha\Captcha;

$data = Captcha::generate();
```

返回示例：

```php
[
    'text': 'Aj9s',
    'token': 'jCTY18DD20Y4txRyIj...',
    'width': 80,
    'height': 40,
    'data': 'data:image/png;base64,iVBORw0KGgoAAA...'
]
```

| 字段     | 类型     | 说明                                                        |
| -------- | -------- | ----------------------------------------------------------- |
| `text`   | `string` | 验证码原文，仅用于服务端校验，**不应返回给客户端**          |
| `token`  | `string` | 验证时提交的 token                                          |
| `width`  | `int`    | 验证码图片宽度，单位为像素                                  |
| `height` | `int`    | 验证码图片高度，单位为像素                                  |
| `data`   | `string` | 验证码图片 Base64 Data URI，可直接用于 `<img>` 标签的 `src` |

### 指定规则

默认情况下，验证码使用 `normal` 规则进行验证，即用户输入需要与验证码原文一致。

可通过 `rule` 参数指定验证码规则：

```php
use Pin\Captcha\Rule;

$data = Captcha::generate(Rule::Rev->value);
```

带参数的规则使用 `规则名:参数` 格式：

```php
$data = Captcha::generate('first:2');
```

支持的规则请参阅[验证码规则](#rules)。

### 暗色模式

通过 `dark` 参数生成适用于暗色背景的验证码：

```php
$data = Captcha::generate(
    dark: true,
);
```

## 验证码校验

验证码校验时，需要提交用户输入的验证码和生成时返回的 `token`。

提交格式：

```text
input|token
```

- `input`：用户输入的验证码
- `token`：生成验证码时返回的 `token`

### 校验方法

#### validate()

`validate()` 用于直接校验验证码，验证失败时会抛出异常：

```php
use Pin\Support\Facades\Captcha;

Captcha::validate($payload);
```

#### verify()

`verify()` 用于校验验证码，并返回验证结果对象：

```php
$result = Captcha::verify($payload);
if ($result->err === null) {
    // 验证通过
}
```

::: info
验证码校验默认不区分大小写。
:::

### 调试输入

在**非生产环境**中，可通过 `plain:` 前缀指定验证码输入内容：

```text
plain:1234|token
```

## 验证码规则 {#rules}

验证码规则用于定义用户输入与验证码原文之间的验证方式。

### `normal` {#normal}

默认规则，用户输入需要与验证码原文一致。

例如验证码为：

```text
6809
```

用户输入：

```text
6809
```

### `rev` {#rev}

倒序验证，用户输入需要为验证码原文的倒序结果。

```php
$data = Captcha::generate('rev');
```

例如验证码原文为：

```text
6809
```

用户输入：

```text
9086
```

### `order:{param}` {#order}

按照指定顺序重新排列验证码原文中的字符。

```php
$data = Captcha::generate('order:2134');
```

例如：

```text
验证码原文：6809
规则参数：  2134
用户输入：  8609
```

### `first:{n}` {#first}

验证验证码原文的前 N 位：

```php
$data = Captcha::generate('first:2');
```

例如验证码原文为：

```text
6809
```

用户输入：

```text
68
```

---

### `last:{n}` {#last}

验证验证码原文后 N 位：

```php
$data = Captcha::generate('last:2');
```

例如验证码原文为：

```text
6809
```

用户输入：

```text
09
```

### `prepend:{n}` {#prepend}

将验证码原文中指定位置的字符添加到开头。

```php
$data = Captcha::generate('prepend:2');
```

例如验证码原文为：

```text
6809
```

用户输入：

```text
86809
```

### `append:{n}` {#append}

将验证码原文中指定位置的字符添加到末尾。

```php
$data = Captcha::generate('append:2');
```

例如验证码原文为：

```text
6809
```

用户输入：

```text
68098
```

### `fixed:{value}` {#fixed}

固定值验证。

该规则不依赖验证码原文，用户输入必须与指定值一致：

```php
$data = Captcha::generate('fixed:abcd');
```

用户输入：

```text
abcd
```

::: tip
`fixed` 参数仅支持字母和数字。
:::

### 内置路由

`pin.captcha.routes.enabled` 用于控制是否注册验证码相关路由：

```php
'routes' => [
    'enabled' => true,
],
```

默认提供：

- `GET /api/captcha`：生成验证码
- `GET /api/captcha/rules`：获取规则列表

如需自定义验证码接口，可关闭内置路由：

```php
'routes' => [
    'enabled' => false,
],
```

### 缓存与一次性验证

`cache_enabled` 用于控制验证码是否启用一次性验证，

```php
'cache_enabled' => env('CAPTCHA_CACHE_ENABLED', true),
```

- `true`：校验后立即失效
- `false`：有效期内可重复验证
