---
title: 路由 | 核心功能
---

# 路由

Pin 使用枚举定义路由。

每个枚举 case 表示一条路由，并贯穿路由注册、URL 生成与 HTTP 测试。

```php
namespace App\Routes;

use Pin\Password\Middleware\DecodePassword;
use Pin\Route\IError;
use Pin\Route\InteractsWithRoute;

enum UserRoute: string implements IError
{
    use InteractsWithRoute;

    case Index = 'GET:/api/users';

    #[Middleware(DecodePassword::class)]
    case Create = 'POST:/api/users';
}
```

## 路由定义

每个枚举 case 表示一条路由，支持以下两种格式：

- `method:uri`
- `method:uri|name`

其中：

- `method` 表示请求方法
- `uri` 表示路由 URI
- `name`：表示路由名称

路由的请求方法、URI 和名称通过 case 值定义，处理器、中间件、标题等附加信息通过 PHP Attribute（`#[...]`）定义。

### 请求方法

```php
case Index = 'GET:/api/users';
case Create = 'POST:/api/users';
case Update = 'PUT:/api/users/{id}';
case Delete = 'DELETE:/api/users/{id}';
```

::: info
请求方法会自动转换为大写。

```php
case Index = 'get:/api/users'; // GET
case Index = 'Get:/api/users'  // GET
```

:::

### 路由 URI

路由 URI 定义接口访问路径。

```php
case Index = 'GET:/api/users';
case Update = 'PUT:/api/users/{id}';
```

使用 `#[Prefix]` 可为整个路由枚举声明统一前缀，最终路由 URI 为 **前缀 + 路由 URI**。

```php
use Pin\Route\Attributes\Prefix;

#[Prefix('/api/users')]
enum UserRoute: string
{
    case Index = 'GET:/';
    case Update = 'PUT:/{id}';
}
```

注册的路由：

```text
GET /api/users
PUT /api/users/{id}
```

::: info
路由 URI（包括 `#[Prefix]`）会自动规范化，去除首尾 `/`，并统一以 `/path` 形式注册和返回。

```php
case Create = 'POST:/api/users/';       // /api/users
case Update = 'PUT:api/users/{id}';    // /api/users/{id}
```

:::

### 路由名称

每条路由都对应一个唯一名称。

默认情况下，路由名称根据枚举和路由定义自动生成。

#### 默认名称

如果未显式指定名称，Pin 会按照以下规则生成：

- 移除 URI 开头的 `/api` 前缀。
- 去除 URI 两侧的 `/`。
- 将 URI 分隔符 `/` 转换为 `.`。
- 根据请求方法追加操作名称：

  - `POST` 追加 `create`。
  - `PUT` 追加 `update`。
  - `DELETE` 追加 `delete`。

- `GET` 请求中的动态参数 `{id}` 在名称生成时转换为 `detail`。

示例：

| case 值                  | 路由名称       |
| ------------------------ | -------------- |
| `GET:/api/users`         | `users`        |
| `GET:/api/users/{id}`    | `users.detail` |
| `POST:/api/users`        | `users.create` |
| `PUT:/api/users/{id}`    | `users.update` |
| `DELETE:/api/users/{id}` | `users.delete` |
| `GET:/api/v1/users`      | `v1.users`     |

#### 显式指定名称

如果默认生成的名称不符合语义，可以显式指定。

在 case 值中通过 `|name` 指定：

```php
case Index = 'GET:/api/users|users.index';
```

或通过 `#[Name]` 属性指定：

```php
use Pin\Route\Attributes\Name;

#[Name('users.index')]
case Index = 'GET:/api/users';
```

### 处理器

处理器用于指定路由请求的处理入口。

#### 默认处理器 {#handler}

默认情况下，Pin 会根据默认约定自动推导对应的控制器和方法：

- 根据当前模块推导对应控制器，详见[模块与推导](/guide/module#controller)。
- 使用枚举 case 名称的小驼峰形式作为方法名。

例如：

```php
case Create = 'POST:/api/users';
```

默认会推导为：

```php
[UserController::class, 'create']
```

#### 显式指定处理器

如果默认约定不满足需求，可通过 `#[Handler]` 指定处理器。

```php
use Pin\Route\Attributes\Handler;

#[Handler([UserHandler::class, 'handle'])]
case Export = 'GET:/api/users/export';
```

`#[Handler]` 支持常见的处理器形式：

```php
#[Handler('UserController@store')]
case Create = 'Post:/api/users';

#[Handler([UserHandler::class, 'handle'])]
case Export = 'GET:/api/users/export';

#[Handler(UserInvokableHandler::class)]
case Import = 'POST:/api/users/import';

```

::: info
如需使用自定义处理器（例如闭包），请参阅[自定义处理器](#custom-handler)。
:::

### 中间件

通过 `#[Middleware]` 属性为路由指定一个或多个中间件。

`#[Middleware]` 支持单个中间件或中间件数组：

```php
use Pin\Route\Attributes\Middleware;
use Pin\Password\Middleware\DecodePassword;

#[Middleware(DecodePassword::class)]
case Create = 'POST:/api/users';

#[Middleware(['email', 'verified'])]
case Profile = 'GET:/api/users/profile';
```

### 附加属性

除了名称、处理器和中间件外，Pin 还提供了一些用于特定场景的路由属性。

::: details 标题与测试

#### 路由标题

`Title` 用于为路由定义一个可读的标题，可用于菜单、权限树、测试报告等需要展示路由信息的场景。

```php
use Pin\Route\Attribute\Title;

#[Title('用户列表')]
case Index = 'GET:/api/users';
```

#### Action

`Action` 用于为 HTTP 测试指定默认的业务操作 [Action](/features/action)。

```php
use Pin\Route\Attributes\Action;

#[Action(ListUsersAction::class)]
case Index = 'GET:/api/users';
```

#### 测试方法

`TestingMethod` 用于为 HTTP 批量测试指定默认的[测试方法](/testing/http-tests#tests)。

```php
use Pin\Route\Attributes\TestingMethod;

#[TestingMethod(Pin\Route\Testing\TestingMethod::Successful)]
case Index = 'GET:/api/users';
```

:::

## 路由注册

Pin 支持两种路由注册方式：单个注册和批量注册。

### 单个注册 {#register-single}

每个枚举 case 都可以单独注册。注册时，还可以指定中间件和权限标识。

使用闭包作为处理器：

```php
UserRoute::Create->register(
    fn () => app(UserService::class)->create()
);
```

指定中间件：

```php
use Pin\Password\Middleware\DecodePassword;

UserRoute::Create->register(
    handler: [UserController::class, 'store'],
    middlewares: [DecodePassword::class, 'verified'],
);
```

::: info
`register()` 未显式指定中间件或权限标识时，会使用[路由属性](#attributes)中 `#[Middleware]` 和 `#[Access]` 声明的配置。
:::

### 批量注册 {#register-batch}

对于应用中的常规路由，推荐使用批量注册方式。

```php
// routes/api.php

use Pin\Route\RouteRegistrar;
use Pin\Route\RouteScanner;

RouteRegistrar::register(
    new RouteScanner()->scan([
        app_path('Routes'),
        app_path('Modules'),
    ])
);
```

::: info
`RouteScanner` 会扫描以 `Route.php` 结尾，并实现 `Pin\Route\Routable` 的枚举类。
:::

也可以直接将一个或多个枚举类传递给 `RouteRegistrar::register()`。

```php
// routes/api.php

use App\Modules\Product\Routes\ProductRoute;
use App\Routes\HomeRoute;
use App\Routes\User\UserRoute;
use Pin\Route\RouteRegistrar;
use Pin\Route\RouteScanner;

RouteRegistrar::register([
    HomeRoute::class,
    UserRoute::class,
    ProductRoute::class
]);
```

### 自定义路由注册 {#custom-register-routes}

默认情况下，Pin 会根据路由枚举中定义的信息注册路由；如需自定义注册方式，可以覆盖 `registerRoutes()` 方法。

将当前路由枚举中的路由放入 middleware group：

```php
use Illuminate\Support\Facades\Route;

public static function registerRoutes(): void
{
    Route::middleware('auth')->group(fn () => self::addRoutes());
}
```

显式注册每个路由：

```php
public static function registerRoutes(): void
{
    self::Generate->register(
        handler: [CaptchaController::class, 'generate'],
    );

    self::AvailableRules->register(
        handler: [CaptchaController::class, 'availableRules'],
        middlewares: 'auth',
    );
}
```

### 自定义处理器 {#custom-handler}

默认情况下，Pin 会根据约定解析路由[处理器](#handler)；如需自定义处理器解析方式，可以覆盖 `handler()` 方法。

使用统一处理入口：

```php
use Illuminate\Http\Request;
use Pin\Http\ApiResponse;

protected function handler()
{
    return function (Request $request) {
        return ApiResponse::success(
            message: $request->route()->getName()
        );
    };
}
```

自定义控制器方法：

```php
protected function handler()
{
    return [
        $this->controller(),
        'action'.lcfirst($this->name),
    ];
}

```

### 查看已注册路由

注册完成后，Pin 会保存枚举 case 和 Laravel Route 实例之间的关联关系。

可以通过 `RouteRegistry::items()` 获取已注册的路由信息：

```php
use Pin\Http\ApiResponse;
use Pin\Route\RouteRegistryItem;

public function routes(): ApiResponse
{
    $data = RouteRegistry::items()->map(fn (RouteRegistryItem $item) => [
        'name' => $item->route->getName(),
        'action' => $item->route->getActionName(),
        'case' => get_class($item->case).'::'.$item->case->name,
        'title' => $item->case->title(),
    ])->values();

    return $this->success($data);
}
```

响应示例：

```json
{
  "code": 0,
  "message": "请求成功",
  "data": [
    {
      "name": "auth.login",
      "action": "App\\Modules\\Auth\\LoginController@login",
      "case": "App\\Routes\\Auth\\LoginRoute::Login",
      "title": "登录"
    },
    {
      "name": "users.create",
      "action": "App\\Modules\\User\\UserController@create",
      "case": "App\\Routes\\User\\UserRoute::Create",
      "title": "新增用户"
    }
  ]
}
```

## 路由使用

### 获取请求方法

通过 `method()` 方法获取请求方法：

```php
case Index = 'GET:/api/users';

UserRoute::Index->method(); // GET
```

### 获取路由 URI

通过 `uri()` 方法获取路由 URI：

```php
case Index = 'GET:/api/users';

UserRoute::Index->uri(); // /api/users
```

### 获取路由名称

通过 `name()` 方法获取路由名称。

```php
case Index = 'GET:/api/users';
case Show = 'GET:/api/users/{id}';

UserRoute::Index->name();  // users
UserRoute::Show->name();  // users.detail
```

### 获取路由属性

通过 `attribute()` 方法获取 `#[...]` 定义的属性：

```php
#[Attribute('value')]
case Index = 'GET:/api/users';
case Create = 'POST:/api/users';

UserRoute::Index->attribute();  // Attribute('value') 对象
UserRoute::Create->attribute(); // null
```

### URL 生成

通过 `route()` 方法生成 URL。

```php
case Index = 'GET:/api/users';
case Show = 'GET:/api/users/{id}';
```

基础用法：

```php
UserRoute::Index->route(); // https://example.com/api/users
```

路由参数：

```php
UserRoute::Show->route(['id' => 1]); // https://example.com/api/users/1
```

生成相对 URL：

```php
UserRoute::Index->route(null, false);       // /api/users
UserRoute::Show->route(['id' => 1], false); // /api/users/1
```

::: info
`route` 方法会自动使用当前枚举对应的路由名称生成 URL，用法与 Laravel 的 `route()` 函数一致。
:::

### HTTP 测试

枚举 case 提供 HTTP 测试入口。

常用方法：

- `testing()`：创建当前路由的 HTTP 测试实例。
- `testJson()`：`testing()->json()` 的快捷调用方式。
- `tests()`：创建多个路由的批量测试套件。

#### 单个路由测试

通过 `testJson()` 方法：

```php
// UserTest.php

UserRoute::Index->testJson($this)->paginated();
```

通过 `testing()` 方法：

```php
UserRoute::Create->testing($this)
    ->withPayload(['username' => null])
    ->json()
    ->assertCode(422, 422)
    ->assertInvalid('username');
```

设置路由参数：

```php
UserRoute::Update->testing($this)
    ->withRouteParams(['id' => 10000])
    ->json()
    ->assertUpdated();
```

#### 自动测试

可以通过 `tests()` 批量执行路由测试。

##### 指定路由：

```php
UserRoute::tests([
    UserRoute::Index,
    UserRoute::Create,
])->run();
```

##### 全部路由：

```php
UserRoute::tests()->run();
```

详细用法请参阅 [HTTP 测试](/testing/http-tests)。
