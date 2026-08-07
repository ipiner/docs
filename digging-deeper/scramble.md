---
title: 接口文档生成 | 继续深入
---

# 接口文档生成

Pin 集成了 [Dedoc Scramble](https://scramble.dedoc.co/)，用于从 Laravel 控制器、PHPDoc 和类型声明中生成 OpenAPI 文档。

Scramble 负责路由扫描、类型推导和 OpenAPI 生成；Pin 在此基础上补充框架级约定，让生成的接口文档更符合 Pin 的统一响应、分页、认证和调试方式。

Pin 的 Scramble 集成主要提供三类能力：

- 为 OpenAPI 文档补充 Bearer Token 认证声明。
- 让 `ApiResponse<T>`、`Pagination<T>` 等泛型响应正确映射为 OpenAPI schema。
- 提供 `Created`、`Updated`、`Deleted`、`SelectOption` 等常用响应结构模板。

## 工作链路

接口文档的生成过程可以概括为：

```text
控制器 PHPDoc
  -> Scramble 类型推导
  -> Pin 响应结构扩展
  -> OpenAPI schema
  -> Elements / Scalar 文档页面
```

其中，Scramble 仍然是 OpenAPI 的生成核心。Pin 不替代 Scramble 的能力，而是让 Scramble 更准确地理解 Pin 项目中的统一响应结构。

## 安装依赖

Pin 将 `dedoc/scramble` 作为开发期依赖使用：

```bash
composer require --dev dedoc/scramble
```

当 Scramble 未安装时，Pin 不会因为 Scramble 集成而报错。相关服务提供者会先判断 Scramble 是否存在：

```php
if (! class_exists(Scramble::class)) {
    return;
}
```

安装 Scramble 后，Pin 会自动接入文档增强能力。

::: tip
Pin 负责补充框架约定，Scramble 负责生成 OpenAPI。文档页面访问、OpenAPI 导出和 Scramble 原生配置仍以 Scramble 官方能力为准。
:::

## 配置

Pin 默认提供 `config/scramble.php`，作为 Scramble 集成的基础配置。

```php
use Pin\Scramble\TypeToSchemaExtensions\ResponseTypeToSchema;

return [
    'renderers' => [
        'elements' => [
            'hideSchemas' => true,

            // https://docs.stoplight.io/docs/elements/b074dc47b2826-elements-configuration-options
            // 更多配置项
        ],
        'scalar' => [
            'credentials' => 'include',

            // https://scalar.com/products/api-references/configuration
            // 更多配置项
        ],
    ],
    'extensions' => [
        ResponseTypeToSchema::class,
    ],
];
```

配置分为两部分：

| 配置项       | 说明                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderers`  | 文档页面渲染器配置，默认包含 [Stoplight Elements](https://docs.stoplight.io/docs/elements/b074dc47b2826-elements-configuration-options) 和 [Scalar](https://scalar.com/products/api-references/configuration) |
| `extensions` | Scramble 类型扩展，Pin 默认注册 `ResponseTypeToSchema`                                                                                                                                                        |

::: tip
项目可以通过 `config/scramble.php` [递归覆盖默认配置](/guide/configuration#layers)。
:::

## Bearer Token 认证声明

Pin 会为生成的 OpenAPI 文档添加全局 Bearer Token 认证声明：

```php
Scramble::configure()->withDocumentTransformers(function (OpenApi $openApi) {
    $openApi->components->securitySchemes['bearer'] = SecurityScheme::http('bearer');
    $openApi->security[] = new SecurityRequirement([
        'bearer' => [],
    ]);
});
```

对应的 OpenAPI 结构类似于：

```yaml
components:
  securitySchemes:
    bearer:
      type: http
      scheme: bearer
security:
  - bearer: []
```

这表示文档中的接口默认使用 Bearer Token 作为认证方式。

::: warning
OpenAPI 中的 `security` 只是文档声明，不是运行时安全控制。
真实的认证、鉴权、Token 解析和权限检查仍需要由服务端 guard、middleware 或相关模块完成。
:::

## 泛型响应推导

Pin 的接口通常使用统一响应结构：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {}
}
```

如果只依赖默认类型推导，Scramble 通常只能识别响应外层字段，例如 `code`、`message`、`data`、`meta`。但在实际接口文档中，开发者更关心 `data` 内部的业务结构。

为了解决这个问题，Pin 提供了 `ResponseTypeToSchema` 扩展，用于处理统一响应中的泛型类型：

| 类型             | 推导结果                                 |
| ---------------- | ---------------------------------------- |
| `ApiResponse<T>` | 将 `T` 映射到响应 schema 的 `data` 字段  |
| `Pagination<T>`  | 将 `T` 映射到分页 schema 的 `items` 字段 |

### 普通对象响应

```php
use Pin\Http\ApiResponse;

/**
 * @return ApiResponse<UserResource>
 */
public function show(): ApiResponse
{
    return $this->success(UserResource::make($user));
}
```

文档会生成类似结构：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": {
    "...": "UserResource schema"
  }
}
```

也就是说，接口仍然保持统一响应外壳，同时 `data` 字段会展示 `UserResource` 的具体结构。

### 分页响应

```php
use Pin\Http\ApiResponse;
use Pin\Pagination\Pagination;

/**
 * @return ApiResponse<Pagination<UserResource[]>>
 */
public function index(): ApiResponse
{
    return $this->success(User::query()->pagination());
}
```

分页响应会分两层推导：

```text
ApiResponse<Pagination<UserResource[]>>
  -> data: Pagination<UserResource[]>
  -> data.items: UserResource[]
```

这样生成的接口文档既能展示统一响应外壳，也能展示分页列表项的字段结构。

### array shape 响应

Scramble 支持从 PHPDoc 读取 array shape。对于字段较少、结构稳定的响应，可以直接使用 array shape，而不必额外创建 Resource。

```php
/**
 * @return ApiResponse<array{token: string, data: string, enabled: null|bool}>
 */
public function generate(): ApiResponse
{
    // ...
}
```

这种写法适合验证码、配置项、简单状态等小型响应结构。

## 常用响应模板

Pin 提供了一组轻量的响应结构模板，用于描述常见接口返回值。

这些模板主要服务于文档 schema 推导。它们不是强制的运行时返回类型，也不是数据库操作结果对象。

### Created

`Created` 适合创建成功后只返回新资源 ID 的接口。

```php
use Pin\Scramble\Created;

/**
 * @return ApiResponse<Created>
 */
public function store(): ApiResponse
{
    return $this->success([
        'id' => $model->id,
    ]);
}
```

对应结构：

```php
[
    'id' => 0,
]
```

### Updated

`Updated` 适合更新成功后返回更新状态和版本号的接口。

```php
use Pin\Scramble\Updated;

/**
 * @return ApiResponse<Updated>
 */
public function update(): ApiResponse
{
    return $this->success([
        'updated' => true,
        'v' => $model->v,
    ]);
}
```

对应结构：

```php
[
    'updated' => true,
    'v' => 0,
]
```

其中，`v` 可用于乐观锁、资源版本号或更新后的版本标识。

### Deleted

`Deleted` 适合删除接口。

```php
use Pin\Scramble\Deleted;

/**
 * @return ApiResponse<Deleted>
 */
public function destroy(): ApiResponse
{
    return $this->success([
        'deleted' => true,
    ]);
}
```

对应结构：

```php
[
    'deleted' => true,
]
```

### SelectOption

`SelectOption` 适合下拉选项、筛选项、枚举选项等接口。

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

单个选项结构：

```php
[
    'label' => '',
    'value' => 0,
]
```

`value` 支持 `int|string`，可用于数字 ID、字符串枚举值等场景。

::: tip
这些模板可以让 PHPDoc 更简洁，同时保持运行时响应仍然使用普通数组、Resource 或项目中的实际返回结构。
:::

## API 文档调试来源

文档页面通常会直接发起接口调试请求。Pin 通过 `config/app.php` 中的 `x_api_document` 配置识别这类请求：

```php
'x_api_document' => [
    'enabled' => env('APP_ENV') !== 'production',
    'allows' => Str::explode(
        env('X_API_DOCUMENT_ALLOWS', 'Apifox,Scramble,docs/api')
    ),
],
```

这会影响开发期调试体验：

- `ValidateCsrfToken` 会跳过来自 API 文档的请求。
- 非生产环境下，可以配合 `plain:` 明文输入绕过加密字段处理，便于文档调试。
- 文档请求不会被误判为真实前端页面请求。

::: info
文档调试来源判断逻辑见：[请求](/features/request#isFromApiDocument)
:::

::: warning
`x_api_document.enabled` 在生产环境默认关闭。如果需要在生产环境开放 API 文档调试，请同时检查认证、CSRF、CORS、Cookie 策略和敏感接口暴露范围。
:::

## 推荐写法

### 使用分组组织接口

Scramble 支持通过属性为接口分组。Pin 的内置控制器也采用这种方式：

```php
use Dedoc\Scramble\Attributes\Group;

#[Group('系统 / 日志')]
class OperationLogController extends Controller
{
}
```

分组后，文档导航会更接近业务模块结构。

### 使用统一响应类型

接口建议统一返回 `ApiResponse<T>`：

```php
use Pin\Http\ApiResponse;

/**
 * @return ApiResponse<array{id: int, name: string}>
 */
public function show(): ApiResponse
{
    return $this->success([
        'id' => 1,
        'name' => 'Pin',
    ]);
}
```

统一响应类型可以让文档、测试和前端调用都围绕同一套响应结构工作。

### 分页接口标明 Pagination

分页接口建议明确写出 `Pagination<T>`：

```php
/**
 * @return ApiResponse<Pagination<UserResource[]>>
 */
public function index(): ApiResponse
{
    return $this->success(User::query()->pagination());
}
```

这样可以让 `data.items` 的字段结构被准确推导出来。

### 小结构使用 array shape

字段较少、结构稳定的响应可以直接使用 array shape：

```php
/**
 * @return ApiResponse<array{
 *     token: string,
 *     enabled: null|bool
 * }>
 */
```

这种方式轻量、直观，适合简单响应。

### 复杂结构使用 Resource

当响应字段较多、存在复用需求，或结构会随业务增长时，建议使用正式的 Laravel Resource。

```php
/**
 * @return ApiResponse<UserResource>
 */
public function show(): ApiResponse
{
    return $this->success(UserResource::make($user));
}
```

### 重复结构使用模板

创建、更新、删除和选项列表等重复结构，可以直接复用 Pin 提供的模板：

```php
ApiResponse<Created>
ApiResponse<Updated>
ApiResponse<Deleted>
ApiResponse<SelectOption[]>
```

这能减少重复定义，也能让文档结构保持一致。
