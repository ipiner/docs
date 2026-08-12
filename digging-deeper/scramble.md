---
title: API 文档
---

# API 文档

Pin 基于 [Dedoc Scramble](https://scramble.dedoc.co/) 生成 OpenAPI 文档。

## 文档生成

API 文档的核心过程由 Scramble 完成：

```text
Laravel 接口
   ↓
路由 / 控制器 / PHPDoc / 类型声明
   ↓
Scramble 类型分析
   ↓
Pin 响应类型扩展
   ↓
OpenAPI Schema
   ↓
文档页面
```

Pin 主要补充统一响应、分页以及常用响应结构的类型信息。

## 响应类型

Pin 的接口通常使用统一响应结构：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {}
}
```

`data` 的具体类型通过 PHPDoc 泛型描述：

```php
/**
 * @return ApiResponse<UserResource>
 */
public function show(): ApiResponse
{
    return $this->success(UserResource::make($user));
}
```

生成的文档会同时描述统一响应结构和 `data` 的具体类型：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {
    "...": "UserResource schema"
  }
}
```

### ApiResponse

`ApiResponse<T>` 用于描述统一响应中 `data` 的类型。

例如：

```php
/**
 * @return ApiResponse<UserResource>
 */
```

表示：

```text
data → UserResource
```

对于字段较少的简单结构，可以直接使用 array shape：

```php
/**
 * @return ApiResponse<array{
 *     token: string,
 *     enabled: null|bool
 * }>
 */
```

### Pagination

`Pagination<T>` 用于描述分页数据中的列表项类型：

```php
use Pin\Http\ApiResponse;
use Pin\Pagination\Pagination;

/**
 * @return ApiResponse<Pagination<UserResource>>
 */
public function index(): ApiResponse
{
    return $this->success(User::query()->pagination());
}
```

类型关系为：

```text
ApiResponse<Pagination<UserResource>>
              ↓
            data
              ↓
       Pagination<UserResource>
              ↓
            items
              ↓
        UserResource[]
```

这样文档可以继续推导 `items` 中资源的字段结构。

## 常用响应结构

Pin 提供了一组常用的响应结构类型，用于描述创建、更新、删除以及选项等接口的返回值。

### Created

`Created` 用于描述创建接口返回新资源 ID：

```php
use Pin\Scramble\Created;

/**
 * @return ApiResponse<Created>
 */
public function store(): ApiResponse
{
    $res = $this->service->create();

    return $this->success($res);

    // return $this->success(['id' => 1]);
}
```

对应的数据结构：

```php
[
    'id' => 1,
]
```

### Updated

`Updated` 用于描述更新接口返回更新状态和版本号：

```php
use Pin\Scramble\Updated;

/**
 * @return ApiResponse<Updated>
 */
public function update(): ApiResponse
{
    $res = $this->service->update($id, $data);

    return $this->success($res);

    // return $this->success(['updated' => true, 'v' => 1]);
}
```

对应的数据结构：

```php
[
    'updated' => true,
    'v' => 1, // optional
]
```

### Deleted

`Deleted` 用于描述删除接口返回的删除状态：

```php
use Pin\Scramble\Deleted;

/**
 * @return ApiResponse<Deleted>
 */
public function delete(): ApiResponse
{
    $res = $this->service->delete($id);

    return $this->success($res);

    // return $this->success(['deleted' => true]);
}
```

对应的数据结构：

```php
[
    'deleted' => true,
]
```

### SelectOption

`SelectOption` 用于描述下拉选项、筛选条件和枚举选项：

```php
use Pin\Scramble\SelectOption;

/**
 * @return ApiResponse<array{
 *     events: SelectOption[],
 *     subject_types: SelectOption[]
 * }>
 */
public function options(): ApiResponse
{
    // ...
}
```

单个选项的结构为：

```php
[
    'label' => '',
    'value' => 0,
]
```

## API 文档调试

Pin 可以识别来自 API 文档的请求，并按照 API 调试场景进行处理，例如支持 `plain:` 明文输入。

请求来源的具体判断方式见：[请求](/features/request#isFromApiDocument)。

### 示例

[ipiner/admin](https://github.com/ipiner/admin) 项目是一个基于 Pin 开发的极简后台管理系统 API 示例，其 API 文档由 Scramble 根据实际接口生成：

[https://admin.ipiner.cn/api](https://admin.ipiner.cn/api)

该文档支持以下调试能力：

- **`plain:` 明文输入**：对于需要加密传输的字段，可以使用 `plain:` 前缀直接传递明文。
- **Fake 响应**：支持使用 `_fake=1` 获取 Action 规则中定义的 Fake 数据。

例如：

```text
plain:password
```

获取 Fake 响应：

```http
POST /api/system/admin/create

{
    "_fake": 1
}
```

接口返回的数据由对应 Action 的 [Fake 规则](/testing/fake) 定义。
