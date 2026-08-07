---
title: HTTP 测试 | 测试相关
---

# HTTP 测试

Pin 的 HTTP 测试基于 Laravel HTTP 测试，并围绕路由枚举组织测试流程。

## 测试实例

`Pin\Route\Testing\Testing` 表示一个路由测试上下文实例。

创建实例后，`Testing` 会根据路由信息和命名约定自动推导测试所需的业务组件。

后续测试会基于该上下文统一处理测试过程中的请求构造、测试数据准备、接口调用以及响应验证。

例如：

```php
$testing = UserRoute::Create->testing($this);
```

在默认约定下，`Testing` 会尝试推导以下组件：

- 领域名称：`User`
- 操作类：`App\Actions\User\CreateAction`
- 模型：`App\Models\User`
- 工厂：`Database\Factories\UserFactory`

如果实际项目结构无法满足默认约定，可以手动覆盖推导结果：

```php
$testing = UserRoute::Create->testing($this)
    ->withDomain('User')
    ->withAction(\App\Modules\User\Actions\CreateUserAction::class)
    ->withFactory(\Database\Factories\UserFactory::class)
    ->withModel(\App\Models\User::class);
```

关于模块结构以及组件自动推导规则，请参考 [模块与推导](/guide/module)。

## 请求准备

在发起请求前，可通过请求准备方法配置路由参数、请求 payload 等上下文信息。

### 路由参数

`withRouteParams()` 用于设置 URL 中的路由参数：

```php
case OrderDetail = 'GET:/api/users/{user}/orders/{order}';

UserRoute::OrderDetail
    ->testing($this)
    ->withRouteParams([
        'user' => 1,
        'order' => 123,
    ]);
```

### 请求数据 {#payload}

`withPayload()` 用于设置当前请求数据：

```php
UserRoute::Create
    ->testing($this)
    ->withPayload([
        'name' => 'Pin',
    ]);
```

基于 [Action](/features/action#fake) 提供的数据生成能力，可以使用 `fakePayload()` 自动生成测试数据：

```php
UserRoute::Create
    ->testing($this)
    ->fakePayload();
```

覆盖默认生成的数据：

```php
UserRoute::Create
    ->testing($this)
    ->fakePayload([
        'name' => 'Pin',
    ]);
```

::: info

对于只读请求（`GET`、`HEAD`、`OPTIONS`），`payload` 会作为路由参数参与 URL 生成；如果同时设置了 `withRouteParams()`，显式指定的路由参数会覆盖同名字段。

对于其他请求方法，`payload` 会作为 JSON 请求数据发送。
:::

## 发起请求

`Testing` 提供统一的 JSON 请求入口，用于根据当前路由定义发起接口调用。

### json()

`json()` 用于根据当前路由定义发送 JSON 请求。

```php
UserRoute::Create
    ->testing($this)
    ->json()
    ->assertCreated();
```

::: info
`json()` 返回 `Pin\Route\Testing\TestResponse` 实例，该对象对 Laravel `TestResponse` 进行轻量封装，提供统一的业务响应 [断言](#assertions) 能力。

:::

#### 请求数据

默认情况下，`json()` 会使用 [`withPayload()`](#payload) 或 `fakePayload()` 设置的请求数据。

也可以在发起请求时直接指定 payload：

```php
UserRoute::Create
    ->testing($this)
    ->json($payload)
    ->assertCreated();
```

#### 请求头

可通过 `headers` 参数设置请求头：

```php
UserRoute::Create
    ->testing($this)
    ->json(headers: ['X-Header' => 'Value'])
    ->assertCreated();
```

也可通过 Laravel 测试实例的 `withHeaders()` 设置：

```php
UserRoute::Create
    ->testing($this->withHeaders(['X-Header' => 'Value']))
    ->json()
    ->assertCreated();
```

::: warning
`withHeaders()` 会设置当前 Laravel 测试用例的默认请求头，并影响后续发起的请求。
:::

### `created()`

`created()` 用于测试资源创建接口，并自动验证创建结果。

```php
UserRoute::Create
    ->testing($this)
    ->created();
```

::: info

默认情况下，`created()` 会使用当前设置的 `payload` 发起请求；未设置时，会使用 Action 自动生成请求数据。

创建成功后，会验证响应中的资源是否成功创建。

:::

`created()` 支持传入回调，用于在资源创建成功后执行自定义断言：

```php
use App\Models\User;

UserRoute::Create
    ->testing($this)
    ->created(
        fn (User $user) => expect($user->name)->toBe('Pin')
    );
```

### `updated()`

`updated()` 用于测试资源更新接口，并自动验证更新结果。

```php
UserRoute::Update
    ->testing($this)
    ->updated();
```

::: info

默认情况下，`updated()` 会根据当前模型对应的 `Factory` 自动创建测试模型，并使用当前设置的 `payload` 发起请求；未设置时，会使用 Action 自动生成请求数据。

请求时会自动设置资源 ID 对应的路由参数，并在更新成功后验证资源是否已更新。

:::

`updated()` 支持传入模型实例、模型 ID 或回调，用于指定更新资源或执行自定义断言：

```php
use App\Models\User;

UserRoute::Update
    ->testing($this)
    ->updated(
        fn (User $user) => expect($user->name)->toBe('Pin')
    );

```

指定更新模型：

```php
$user = User::find(1);

UserRoute::Update
    ->testing($this)
    ->updated(
        $user,
        fn (User $user) => expect($user->name)->toBe('Pin')
    );
```

也可以传入指定需要更新的资源 ID：

```php
UserRoute::Update
    ->testing($this)
    ->updated(1);
```

#### 版本控制

`updated()` 支持基于版本字段 `v` 的乐观锁更新测试。

当请求数据包含 `v` 字段时，`updated()` 会自动使用当前模型版本号替换该字段。

例如，在 Action 的 `rules()` 中定义版本字段：

```php
protected function rules(): array
{
    return [
        // ...
        'v' => 'required|integer',
    ];
}
```

通过 Action 生成测试数据时，包含 `v` 字段的请求数据会自动携带当前模型版本号进行更新测试。

### `deleted()`

`deleted()` 用于测试资源删除接口，并自动验证删除结果。

```php
UserRoute::Delete
    ->testing($this)
    ->deleted();
```

::: info

默认情况下，`deleted()` 会根据当前模型对应的 Factory 自动创建测试模型。

请求时会自动设置资源 ID 对应的路由参数，并验证删除接口响应以及数据库中的资源是否已删除。

:::

`deleted()` 支持传入模型实例、模型 ID 或回调，用于指定删除资源或执行自定义断言：

```php
use App\Models\User;

UserRoute::Delete
    ->testing($this)
    ->deleted(
        fn (User $user) => expect(User::where('id', $user->id)->first())->toBeNull()
    );
```

指定删除模型：

```php
$user = User::find(1);

UserRoute::Delete
    ->testing($this)
    ->deleted(
        $user,
        fn (User $user) => expect(User::where('id', $user->id)->first())->toBeNull()
    );
```

也可以指定需要删除的资源 ID：

```php
UserRoute::Delete
    ->testing($this)
    ->deleted(1);
```

### `paginated()`

`paginated()` 用于测试分页接口，并自动验证分页响应结构。

```php
UserRoute::Index
    ->testing($this)
    ->paginated();
```

::: info

默认情况下，`paginated()` 会根据当前路由发起请求，验证响应是否符合 Pin 分页响应结构。

:::

`paginated()` 支持传入回调执行自定义断言：

```php
UserRoute::Index
    ->testing($this)
    ->paginated(function (
        array $items,
        int $total,
        int $totalPage
    ) {
        expect($total)->toBeGreaterThan(0);
        expect($totalPage)->toBeGreaterThan(0);
    });
```

### `successful()`

`successful()` 用于测试接口成功响应。

- HTTP 响应状态码为 `2xx`；
- 响应业务码 `code` 为成功状态（`0`）。

```php
UserRoute::Action
    ->testing($this)
    ->successful();
```

## 可用断言 {#assertions}

除继承 Laravel HTTP 测试响应的基础断言外，`Pin\Route\Testing\TestResponse` 还提供与 Pin 响应结构匹配的业务断言方法。

### `assertCode()`

`assertCode()` 用于验证接口返回的业务码。

```php
$response->assertCode(0);
```

支持传入错误码：

```php
use App\Errors\UserError;

$response->assertCode(UserError::UserDisabled);
```

也可以同时验证 HTTP 状态码：

```php
$response->assertCode(10010, 403);
```

### `assertSuccessful()`

`assertSuccessful()` 用于验证接口成功响应。

该方法会验证：

- HTTP 响应状态码为 `200`；
- 响应业务码 `code` 为成功状态（`0`）。

```php
$response->assertSuccessful();
```

### `assertInvalid()`

`assertInvalid()` 用于验证请求参数验证失败响应。

验证错误默认从响应 `data.errors` 中读取。

```php
$response->assertInvalid('email');
```

支持同时验证多个字段：

```php
$response->assertInvalid('email,password');

$response->assertInvalid([
    'email',
    'password',
]);
```

### `assertValid()`

`assertValid()` 用于验证请求字段通过验证。

验证错误默认从响应 `data.errors` 中读取。

```php
$response->assertValid('email');
```

支持同时验证多个字段：

```php
$response->assertValid('email,password');

$response->assertValid([
    'email',
    'password',
]);
```

### `assertCreated()`

`assertCreated()` 用于验证资源创建成功响应。

```php
$response->assertCreated();
```

验证成功后，可通过回调获取创建后的资源 ID：

```php
$response->assertCreated(fn (int $id) => expect($id)->toBe(1));
```

### `assertUpdated()`

`assertUpdated()` 用于验证资源更新成功响应。

```php
$response->assertUpdated();
```

### `assertDeleted()`

`assertDeleted()` 用于验证资源删除成功响应。

```php
$response->assertDeleted();
```

### `assertPaginated()`

`assertPaginated()` 用于验证分页响应结构。

```php
$response->assertPaginated();
```

支持传入回调执行自定义验证：

```php
$response->assertPaginated(function (
    array $items,
    int $total,
    int $totalPage
) {
    expect($total)->toBeGreaterThan(0);
});
```

### assertMessage()

断言响应消息。

```php
UserRoute::Create->testing($this)
    ->json()
    ->assertMessage('新增成功');
```

### assertMessageContains()

断言消息包含指定内容。

```php
UserRoute::Create->testing($this)
    ->json()
    ->assertMessageContains('用户名不能为空');
```

### assertMessageMatch()

断言消息匹配指定正则。

```php
UserRoute::Create->testing($this)
    ->json()
    ->assertMessageMatch('/不能为空/');
```

### assertMessageUsing()

使用自定义逻辑验证消息。

```php
UserRoute::Create->testing($this)
    ->json()
    ->assertMessageUsing(
        fn (string $message) => ! str_contains($message, '用户名')
    );
```

## 批量测试

`tests()` 用于创建测试套件，套件包含多个路由测试任务。

默认情况下，`tests()` 会测试当前路由枚举中的全部路由：

```php
UserRoute::tests($this)->run();
```

可传入指定路由，仅测试部分接口：

```php
UserRoute::tests($this, [
    UserRoute::Create,
    UserRoute::Update,
])->run();
```

如果需要自定义测试流程，可以获取测试任务列表再执行：

```php
UserRoute::tests($this)
    ->assertions()
    ->each->run();
```

批量测试会根据路由名称自动匹配对应的测试方法：

| 路由名称关键字 | 默认测试方法   |
| -------------- | -------------- |
| `Create`       | `created()`    |
| `Update`       | `updated()`    |
| `Delete`       | `deleted()`    |
| `Index`        | `paginated()`  |
| 其他           | `successful()` |

如果路由名称无法匹配默认规则，可通过 `#[TestingMethod(...)]` 显式指定测试方法：

```php
use Pin\Route\Attributes\TestingMethod;

#[AssertionMethod(\Pin\Route\Testing\TestingMethod::Successful)]
case Search = 'GET:/api/users/search';
```

## 请求输出

Pin HTTP 测试默认支持输出请求和响应信息，用于查看测试执行过程。

<a href="/images/testing-output.png" target="_blank">
    <img src="/images/testing-output.png" />
</a>

是否启用请求输出由 `config('testing.report_request_enabled')` 控制，也可通过测试实例临时调整：

```php
UserRoute::Create->testing($this)
    ->withReportRequestEnabled(true)
    ->created();
```

如果需要自定义输出格式或处理逻辑，可以使用自定义 `Reporter`：

```php
use Pin\Route\Testing\Reporter;

class CustomReporter extends Reporter
{
    //
}


$reporter = new CustomReporter();

UserRoute::Create->testing($this)
    ->withReporter($reporter)
    ->created();
```

::: info
`Reporter` 用于处理测试请求和响应信息的输出逻辑。
:::
