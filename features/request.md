---
title: 请求 | 核心功能
---

# 请求

Pin 扩展了 `Illuminate\Http\Request`，提供一组用于请求判断和信息获取的辅助方法。

## 请求匹配

`isRequest()` 方法用于判断当前请求是否匹配指定的 URI 或路由名称。

使用 URI：

```php
$request->isRequest(UserRoute::Create->uri());
```

使用路由名称：

```php
$request->isRequest(UserRoute::Create->name());
```

使用数组：

```php
$request->isRequest([
    'api/users/*',
    UserRoute::Create->name(),
]);
```

::: info
URI 匹配规则会忽略开头的 `/`。
:::

## 获取请求来源

`getReferer()` 方法用于获取当前请求的来源地址：

```php
$referer = $request->getReferer();

if (referer !== '') {
    // ...
}
```

返回结果会自动进行 URL 解码。

::: info
该方法优先读取 `x-referer` 请求头；未提供时，将使用 `referer` 请求头。
:::

## 判断只读请求

`isReading()` 方法用于判断当前请求是否为只读请求：

```php
if ($request->isReading()) {
    // ...
}
```

以下方法会被视为只读请求：

- `HEAD`
- `GET`
- `OPTIONS`

## 判断 API 文档请求 {#isFromApiDocument}

`isFromApiDocument()` 用于判断当前请求是否来自 API 文档：

```php
if ($request->isFromApiDocument()) {
    // ...
}
```

判断需要同时满足：

1. `app.x_api_document.enabled` 已启用。
2. 请求来源与 `app.x_api_document.allows` 中的配置匹配。

Pin 支持通过请求头和 `Referer` 两种方式识别 API 文档来源。

### 请求头

API 文档可以通过 `x-api-document` 请求头标识来源：

```http
x-api-document: Scramble
```

允许的来源通过 `X_API_DOCUMENT_ALLOWS` 配置：

```ini
X_API_DOCUMENT_ALLOWS=Apifox,Scramble,docs/api
```

例如：

```http
x-api-document: Scramble
```

当 `Scramble` 出现在允许列表中时，请求会被识别为 API 文档请求。

### Referer

如果请求没有提供 `x-api-document` 请求头，Pin 会继续检查 `Referer` 的路径。

例如：

```text
https://example.com/docs/api
```

对应路径：

```text
/docs/api
```

当 `docs/api` 出现在允许列表中时，请求会被识别为 API 文档请求。

### 配置

`x_api_document` 位于 `config/app.php`：

```php
'x_api_document' => [
    'enabled' => (bool) env(
        'X_API_DOCUMENT_ENABLED',
        env('APP_ENV') !== 'production'
    ),
    'allows' => Str::explode(
        env('X_API_DOCUMENT_ALLOWS', 'Apifox,Scramble,docs/api')
    ),
],
```
