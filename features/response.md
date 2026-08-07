---
title: 响应 | 核心功能
---

# 响应

`Pin\Http\ApiResponse` 是 Pin 默认的 API 响应对象。

它以统一的响应结构返回错误码、响应消息、响应数据，以及可选的元信息和调试信息。

## 响应结构

典型的响应结构如下：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {
    "id": 1,
    "name": "Pin"
  }
}
```

### `code`

`code` 表示错误码。

`0` 表示请求成功，其他值表示请求失败，并对应具体的错误类型。

### `message`

`message` 表示响应消息。

用于描述当前请求的处理结果。

### `data`

`data` 表示响应数据。

根据不同接口，可以返回对象、数组或其他数据类型。

### `meta`

`meta` 表示响应附带的元信息。

通常用于描述响应相关的补充信息，不属于业务数据本身，仅在存在有效内容时返回。

### `debug`

`debug` 表示调试信息。

仅在启用调试模式时返回，用于辅助开发和问题定位。

## 创建响应

`ApiResponse` 提供 `make` 方法，用于创建统一格式的 API 响应：

```php
return ApiResponse::make(
    code: 0,
    message: '请求成功',
    data: [
        'id' => 1,
        'name' => 'Pin',
    ],
);
```

::: info
在实际应用中，API 响应通常由控制器直接返回。Pin 的[基础控制器](/features/controller)封装了 `success` 和 `error` 两个快捷方法，用于创建成功和错误响应。

后续示例均通过控制器方法返回响应。
:::

### 成功响应 {#success}

#### 基础响应

```php
return $this->success();
```

```json
{
  "code": 0,
  "message": "请求成功",
  "data": null
}
```

#### 指定数据

```php
return $this->success([
    'id' => 1,
    'name' => 'Pin',
]);
```

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {
    "id": 1,
    "name": "Pin"
  }
}
```

#### 指定响应消息

```php
return $this->success(
    data: $data,
    message: '保存成功',
);
```

```json
{
  "code": 0,
  "message": "保存成功",
  "data": {}
}
```

如果响应数据为 `Pin\Services\Results\*Result` 类型，则使用 `Result` 提供的消息：

```php
$result = $this->service->update($data); // Pin\Services\Results\UpdateResult

return $this->success($result);
```

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "updated": true,
    "v": 123
  }
}
```

#### 指定元信息

```php
return $this->success(
    data: $data,
    meta: [
        'time' => 58,
    ],
);
```

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {},
  "meta": {
    "time": 58
  }
}
```

#### HTTP 状态码

```php
return $this->success()->withStatusCode(201);
```

#### HTTP 响应头

```php
return $this->success()->withHeaders('X-Request-Source', 'api');
```

批量设置：

```php
return $this->success()->withHeaders([
    'X-Request-Source' => 'api',
    'Cache-Control' => 'no-store',
]);
```

### 错误响应 {#error}

::: info
除错误码外，`error()` 与 `success()` 的使用方式一致，本节仅说明不同之处。
:::

#### 基础响应

```php
return $this->error(Errors::DeleteFailed);
```

```json
{
  "code": 1003,
  "message": "删除失败",
  "data": null
}
```

#### 指定响应消息

```php
return $this->error(
    Errors::DeleteFailed,
    '当前数据无法删除',
);
```

```json
{
  "code": 1003,
  "message": "当前数据无法删除",
  "data": null
}
```

## 自定义响应

`ApiResponse` 实例通过 Laravel 容器解析，支持绑定自定义实现：

```php
use Pin\Http\ApiResponse;

class CustomApiResponse extends ApiResponse
{
  #[\Override]
  protected function debugData(): array
  {
    $data = parent::debugData();
    unset($data['memory'], $data['memory_peak']);

    return $data;
  }
}

app()->bind(ApiResponse::class, CustomApiResponse::class);
```

## 调试信息

`debug` 字段**仅在调试模式下返回**，用于开发和调试，生产环境通常不返回该字段。

`debug` 字段包含当前请求的调试信息，例如请求 ID、执行时间、SQL 数量和内存占用等：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {
    "id": 1,
    "name": "Pin"
  },
  "debug": {
    "request_id": "c67109b1-4142-492f-8748-e4cc780aedc8",
    "env": "local",
    "time": 28,
    "sql_count": 0,
    "sql_time": 0,
    "sqls": [],
    "memory": "4M",
    "memory_peak": "4M"
  }
}
```

## 文档生成 {#scramble}

`ApiResponse` 支持 Scramble 的泛型响应类型推导：

```php
/**
 * @return ApiResponse<Pagination<UserResource[]>>
 */
public function index(): ApiResponse
{
    //
}
```

Scramble 会根据泛型定义生成对应的 OpenAPI Schema，并保留统一的响应结构。

关于 Scramble 集成和响应类型推导，请参考 [接口文档生成](/digging-deeper/scramble)。
