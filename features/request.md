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

## 判断 API 文档请求

`isFromApiDocument()` 方法用于判断当前请求是否来自 API 文档：

```php
if ($request->isFromApiDocument()) {
    // ...
}
```

该方法通过 `app.x_api_document` 配置进行匹配。

::: info

- `app.x_api_document.enabled` 控制是否启用 API 文档请求识别，默认仅在非生产环境启用；
- `app.x_api_document.allows` 配置允许的文档来源，支持请求头 `x-api-document` 和请求来源 URI，并支持通过环境变量设置：

```ini
X_API_DOCUMENT_ALLOWS=Apifox,Scramble,docs/api
```

:::
