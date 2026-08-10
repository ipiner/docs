---
title: Action（操作） | 核心功能
---

# Action（操作）

Action 用于表示一次明确的业务操作。

在 Pin 中，控制器负责接收请求并返回响应，模型负责数据访问，而 Action 用于封装一次业务操作中的输入、验证和处理逻辑。

::: info
创建用户、更新订单、提交支付等操作，都可以定义为独立的 Action。
:::

## 生命周期

一个 Action 从解析到执行，通常会经历以下阶段：

```text
解析 Action
    ↓
绑定输入与上下文
    ↓
初始化 Action
    ↓
验证输入
    ↓
处理业务逻辑
    ↓
返回结果
```

### 解析 Action

Action 由容器解析。

```php
use App\Actions\User\CreateUserAction;
use Pin\Services\Results\CreateResult;

class UserController
{
    public function create(CreateUserAction $action): CreateResult
    {
        return $this->success($action->handle());
    }
}
```

### 输入与上下文

Action 完成解析后，Pin 会根据当前 `Request` 对象初始化输入数据和执行上下文。

::: info
请求输入绑定到 `payload`；路由参数和当前路由名称绑定到 `context`，其中路由名称通过 `__route_name__` 访问。
:::

#### 输入（Payload）

`payload` 表示当前 Action 的输入数据。

```php
// GET /api/users/1?username=alice&email=alice@example.com

$action->payload(); // ['username' => 'alice', 'email' => 'alice@example.com']

$action->payload('username'); // alice
```

更多 payload 用法，请参阅[Payload（数据）](/digging-deeper/support/has-payload)。

#### 上下文（Context）

`context` 表示当前 Action 执行过程中使用的上下文数据。

```php
// GET /api/users/1

$action->context(); // Pin\Support\Context(['id' => '1', '__route_name__' => 'users.detail'])

$action->context('id'); // '1'
```

更多 `context` 用法，请参阅[Context（上下文）](/digging-deeper/support/has-context)。

### 初始化

输入数据和上下文绑定完成后，Action 会执行初始化逻辑。

默认在这一阶段根据约定完成[模型推导](/guide/module#model)。

可以通过 `boot()` 方法定义额外的初始化逻辑。

```php
class UpdateUserAction extends Action
{
    protected int $uid;

    public function boot(): void
    {
        // 显式指定模型类，跳过默认推导
        $this->modelClass = User::class;

        parent::boot();

        $this->uid = (int) $this->context('id');
    }
}
```

::: info 生成模拟数据响应

初始化完成后，当请求携带 `_fake` 参数，并且启用 `pin.action.fake_response_enabled` 配置时，
Pin 会根据 Action 定义的验证规则生成模拟数据，并作为接口响应返回。

例如：

```php
class CreateUserAction extends Action
{
    protected function rules(): array
    {
        return [
            'username' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|fake:password',
        ];
    }
}
```

请求：

```http
POST /api/users

{
    "_fake": 1
}
```

返回示例：

```json
{
  "username": "OuvPvCWjMdmiK5wE",
  "email": "ljacobi@gmail.com",
  "password": "GPznbCjMA0Pd..."
}
```

生成的 JSON 数据可直接作为接口请求参数，用于提交测试：

```http
POST /api/users
```

:::

### 验证

初始化完成后，Action 进入验证阶段，并根据定义的验证规则校验输入数据。

#### 规则定义

`rules()` 方法用于定义验证规则。

```php
class CreateUserAction extends Action
{
    protected function rules(): array
    {
        return [
            'username' => 'required|string',
            'email' => 'required|email',
        ];
    }
}
```

需要根据运行条件动态调整验证规则时，可以使用 `withRules()`：

```php
$data = $action
    ->withRules([
        'name' => 'required|string',
    ])
    ->validated();
```

::: info
`withRules()` 用于临时指定当前 Action 的验证规则。

调用后，已缓存的验证结果会被清除，下一次调用 `validated()` 时会根据新的规则重新验证。
:::

#### 错误消息

`messages()` 方法用于自定义验证错误消息。

```php
protected function messages(): array
{
    return [
        'username.required' => '请输入用户名',
    ];
}
```

#### 验证字段名称

`attributes()` 方法用于定义验证字段名称。

默认情况下，Action 会根据关联模型的元数据获取字段名称。

需要自定义字段名称时，可以覆盖该方法：

```php
protected function attributes(): array
{
    return [
        'username' => '用户名',
    ];
}
```

#### 授权

Action 支持通过 `authorize()` 方法定义授权逻辑。

需要自定义授权检查时，可以在 Action 中添加该方法：

```php
use App\Models\Post;

protected function authorize(): bool
{
    $post = Post::find((int) $this->context('id'));

    return $post && auth()->user()->can('update', $post);
}
```

::: info
当 `authorize()` 方法返回 `false` 时，将抛出 `Illuminate\Validation\UnauthorizedException`。
:::

#### 执行验证

`validated()` 方法用于执行验证，并返回验证通过后的数据。

```php
$data = $this->validated();
```

验证失败时，将抛出 `Illuminate\Validation\ValidationException`。

::: info
`validated()` 会缓存验证结果，多次调用时不会重复执行验证。
:::

#### 验证回调

Action 提供以下验证生命周期回调：

- `passedValidation()`：验证通过后调用；
- `failedValidation()`：验证失败后调用。

可以覆盖这些方法扩展默认行为：

```php
protected function passedValidation(Validator $validator): void
{

    parent::passedValidation()

    $this->prepareData();
}

protected function failedValidation(Validator $validator): void
{
    $this->recordValidationFailed(
        $validator->errors()->toArray()
    );
    parent::failedValidation($validator);
}
```

### 处理业务逻辑

验证通过后，即可执行 Action 定义的业务处理。

通常使用 `handle()` 作为业务处理的调用入口：

```php
public function handle()
{
    return $this->modelClass::create(
        $this->validated()
    );
}
```

## 手动创建 Action

通常通过容器解析 Action，自动注入所需依赖，并处理请求场景下的输入数据、执行上下文和模型解析。

```php
$action = app(CreateUserAction::class);

$user = $action->handle();
```

在脚本、单元测试等无需容器解析的场景中，也可以手动创建：

```php
$action = new CreateUserAction();

$action
    ->payload([
        'username' => 'pin',
        'email' => 'pin@example.com',
    ])
    ->context([
        'tenant_id' => 1,
    ])
    ->boot();

$user = $action->handle();
```

## 查询构建 {#queryable}

查询类 Action 可通过 `queryable()` 方法根据验证规则构建查询对象，并应用于 Eloquent 查询。

```php
use Pin\Validation\QueryableRules;

class ListUsersAction extends Action
{
    protected function rules(): array
    {
        return [
            'keyword' => QueryableRules::ns(
                'id|username|realname'
            ),
            'status' => QueryableRules::inNumeric(),
            'created_at' => QueryableRules::range(),
        ];
    }

    public function handle()
    {
        return $this->modelClass::queryable($this->queryable())
            ->pagination();
    }
}
```

更多查询规则请参阅 [查询构建](/model/queryable)。

## Fake 数据与 HTTP 测试 {#fake}

Action 可以根据验证规则生成测试数据，用于单元测试或 HTTP 测试。

```php
class CreateUserAction extends Action
{
    protected function rules(): array
    {
        return [
            'username' => 'required|string|fake:firstname',
            'email' => ['required', 'email', Fake::email()],
        ];
    }
}
```

静态调用：

```php
$data = CreateUserAction::fake();
```

实例调用：

```php
$data = $action->fakeData();
```

以上方法根据 Action 验证规则生成数据：

```php
[
    'username' => 'Marlen',
    'email' => 'ljacobi@gmail.com',
]
```

也可以传入数据覆盖已有字段或补充额外字段：

```php
$data = CreateUserAction::fake([
    'username' => 'pin',
    'password' => '123456'
]);
```

生成结果：

```php
[
    'username' => 'pin',
    'email' => 'ljacobi@gmail.com',
    'password' => '123456'
]
```

在 HTTP 测试中，可以直接使用 Action 的验证规则生成请求数据：

```php
it(creates('user'), function () {
    UserRoute::Create->testing($this)
        ->fakePayload()
        ->created();
});
```

覆盖或补充请求字段：

```php
it(creates('user'), function () {
    UserRoute::Create->testing($this)
        ->fakePayload(['username' => 'pin'])
        ->created();
});
```

更多用法请参阅 [Fake 数据](/testing/fake) 和 [HTTP 测试](/testing/http-tests)。
