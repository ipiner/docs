---
title: 访问控制 | 扩展包
---

# 访问控制

[ipiner/access](https://github.com/ipiner/access) 提供基于权限码的访问控制机制。

## 安装

```bash
composer require ipiner/access
```

## 配置

访问控制配置文件为 `config/pin/access.php`。

可按需发布配置：

```bash
php artisan vendor:publish --tag=pin-access-config
```

## 用户与权限

Pin 通过 `AccessUser` 定义用户接入访问控制所需的权限信息。

用户模型需要实现 `AccessUser` 接口：

```php
namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Access\Authorizable;
use Illuminate\Support\Collection;
use Pin\Access\Contracts\AccessUser;
use Pin\Models\Model;

class Admin extends Authenticatable implements AccessUser
{
    use Authenticatable, Authorizable;

    /**
     * 用户可访问的权限节点
     */
    public function accessibleMenus(): Collection
    {
        return $this->menus;
    }

    /**
     * 是否拥有全部权限
     */
    public function hasAllAccess(): bool
    {
        return $this->is_admin;
    }
}
```

`accessibleMenus()` 用于返回当前用户可访问的权限节点集合。

每个权限节点通过 `code` 字段定义对应的权限码。

例如：

```php
[
    [
        'code' => 'users',
        'name' => '用户',
    ],
    [
        'code' => 'users.create',
        'name' => '新增用户',
    ],
]
```

Pin 会根据这些权限节点生成：

- `menus()`：用于管理端展示的菜单结构；
- `codes()`：用于权限检查的权限码列表。

```php
use Pin\Support\Facades\Access;

$access = Access::forUser($user);

$menus = $access->menus();
$codes = $access->codes();
```

::: info
Pin 提供 `Pin\Access\Models\Menu` 模型作为默认权限节点实现。

该模型适用于常见后台系统中的菜单、按钮权限场景。
:::

## 路由权限

使用 `Pin\Access\InteractsWithRoute` 定义路由时，Pin 会根据路由名称自动关联访问权限。

默认情况下，权限码由路由名称生成。

例如：

```php
namespace App\Routes;

use Pin\Access\InteractsWithRoute;
use Pin\Route\Routable;

enum UserRoute: string implements Routable
{
    use InteractsWithRoute;

    case Create = 'POST:/api/users';
}
```

`UserRoute::Create` 路由会关联 `users.create`。

也可通过 `#[Access]` 属性指定权限码：

```php
use Pin\Access\Attribute\Access;

#[Access('users.create')]
case Create = 'POST:/api/users';
```

对于不需要权限检查的路由，可使用 `#[Access(false)]`：

```php
#[Access(false)]
case Profile = '/profile';
```

## Gate 授权

Pin 使用 Laravel Gate 进行权限检查，能力名称固定为 `access`。

```php
use Illuminate\Support\Facades\Gate;

Gate::allows('access', UserRoute::Create->name());
```

使用 `denies()` 判断权限：

```php
if (Gate::denies('access', UserRoute::Create->name())) {
    // 无权限
}
```
