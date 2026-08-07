---
title: 模块与推导 | 入门指南
---

# 模块与推导

Pin 遵循约定优于配置的设计理念。

默认情况下，只需遵循统一的命名与目录约定，即可自动推导 `Controller`、`Model`、`Factory` 与 `Action`，无需额外配置。

以 `App\Routes\Product\CategoryRoute::Create` 为例，可推导出：

- 模块：`Product`
- 领域：`Category`
- 动作：`Create`

::: info
类名表达意图，目录表达归属。

统一的命名与目录约定，是推导规则的基础。
:::

## 模块 {#module}

模块用于划分业务边界。

模块由类所在的命名空间推导。

- 位于 `App\Modules\...` 下的类，将所属模块作为模块名。
- 位于 `App\Routes\...` 下的路由枚举，也会按照相同规则推导模块。

模块对应的命名空间如下：

```text
App\Modules\{Module}
```

例如：

| 类                                                 | 模块                  |
| -------------------------------------------------- | --------------------- |
| `App\Modules\Product\Actions\CreateCategoryAction` | `App\Modules\Product` |
| `App\Routes\Product\CategoryRoute`                 | `App\Modules\Product` |
| `App\Routes\DummyRoute`                            | 无                    |

## 领域 {#domain}

领域用于表示核心业务对象。同一领域下的 `Controller`、`Model`、`Factory` 与 `Action` 通常采用一致的命名约定。

领域推导遵循以下命名规则：

- 动作前缀：`Create`、`Update`
- 类型后缀：`Action`、`Service`、`Controller`、`Route`

推导时，Pin 会自动移除这些前缀和后缀，仅保留核心领域名称：

| 类                     | 领域       |
| ---------------------- | ---------- |
| `CreateCategoryAction` | `Category` |
| `UpdateCategoryAction` | `Category` |
| `CategoryAction`       | `Category` |
| `CategoryService`      | `Category` |
| `CategoryController`   | `Category` |
| `CategoryRoute`        | `Category` |

## 控制器 {#controller}

控制器负责接收 HTTP 请求，并调用相应的业务逻辑完成请求处理。

Pin 优先从当前模块中查找对应控制器；如果未找到模块内控制器，则回退到 Laravel 默认的 `App\Http\Controllers` 命名空间结构。

### 模块化结构

当路由属于某个模块时，Pin 会按以下顺序查找控制器：

```text
App\Modules\{Module}\{Domain}Controller
App\Modules\{Module}\{Domain}\{Domain}Controller
```

例如，`App\Routes\Product\CategoryRoute` 会依次尝试：

```text
App\Modules\Product\CategoryController
App\Modules\Product\Category\CategoryController
```

### 默认结构

当路由未关联模块时，Pin 会按以下顺序查找控制器：

```text
App\Modules\{Domain}\{Domain}Controller
App\Http\Controllers\{Domain}Controller
```

例如，`DummyRoute` 会依次尝试：

```text
App\Modules\Dummy\DummyController
App\Http\Controllers\DummyController
```

::: info
如果所有候选控制器类均不存在，Pin 将返回最后一个候选控制器类名。
:::

## 模型 {#model}

模型用于表示数据库实体，并负责应用与数据存储之间的映射。

Pin 优先从当前模块中查找对应模型；如果未找到模块内模型，则回退到 Laravel 默认的 `App\Models` 命名空间结构。

### 模块化结构

当路由属于某个模块时，Pin 会按以下顺序查找模型：

```text
App\Modules\{Module}\Models\{Domain}
App\Models\{Module}\{Domain}
App\Models\{Module}\{Module}{Domain}
App\Models\{Module}{Domain}
App\Models\{Domain}
```

例如，`App\Routes\Product\CategoryRoute` 会依次尝试：

```text
App\Modules\Product\Models\Category
App\Models\Product\Category
App\Models\Product\ProductCategory
App\Models\ProductCategory
App\Models\Category
```

### 默认结构

当路由未关联模块时，Pin 会按以下方式查找模型：

```text
App\Models\{Domain}
```

例如，`DummyRoute` 会推导为：

```text
App\Models\Dummy
```

## 工厂 {#factory}

工厂用于生成模型实例和测试数据。

Pin 优先查找与模块归属匹配的 `Factory`，以保持测试代码与业务代码的一致组织方式。

### 模块化结构

当路由属于某个模块时，Pin 会按以下顺序查找 Factory：

```text
Database\Factories\{Module}\{Domain}Factory
Database\Factories\{Module}{Domain}Factory
Database\Factories\{Domain}Factory
```

例如，`App\Routes\Product\CategoryRoute` 会依次尝试：

```text
Database\Factories\Product\CategoryFactory
Database\Factories\ProductCategoryFactory
Database\Factories\CategoryFactory
```

### 默认结构

当路由未关联模块时，Pin 会按以下方式查找 `Factory`：

```text
Database\Factories\{Domain}Factory
```

例如，`DummyRoute` 会推导为：

```text
Database\Factories\DummyFactory
```

## Action {#action}

Action 用于封装一次具体的业务动作，其类名根据 Route 类名与枚举 Case 自动推导。

例如：

```php
App\Routes\Product\CategoryRoute::Create
```

Pin 会根据 Route 类名推导模块 `Product`、领域 `Category`，并结合枚举 Case `Create` 生成候选 Action 类名，然后按顺序查找。

### 模块化结构

当路由属于某个模块时，Pin 会按以下顺序查找 Action：

```text
App\Modules\{Module}\{Domain}\Actions\{Case}{Domain}Action
App\Modules\{Module}\{Domain}\Actions\{Case}Action
App\Modules\{Module}\Actions\{Case}{Domain}Action
App\Modules\{Module}\Actions\{Case}Action
```

例如，`App\Routes\Product\CategoryRoute::Create` 会依次尝试：

```text
App\Modules\Product\Category\Actions\CreateCategoryAction
App\Modules\Product\Category\Actions\CreateAction
App\Modules\Product\Actions\CreateCategoryAction
App\Modules\Product\Actions\CreateAction
```

### 默认结构

当路由未关联模块时，Pin 会按以下顺序查找 Action：

```text
App\Modules\{Domain}\{Domain}Action
App\Actions\{Domain}Action
App\Actions\{Domain}\{Case}{Domain}Action
App\Actions\{Domain}\{Case}Action
```

例如，`DummyRoute::Index` 会依次尝试：

```text
App\Modules\Dummy\DummyAction
App\Actions\DummyAction
App\Actions\Dummy\IndexDummyAction
App\Actions\Dummy\IndexAction
```

::: tip
如果 Route Case 上声明了 `#[Action(...)]`，Pin 将优先使用显式配置，并跳过默认推导。
:::

## 推荐命名

建议优先遵循 Pin 的默认命名约定：

| 类型        | 推荐写法                                                    |
| ----------- | ----------------------------------------------------------- |
| 路由枚举    | `App\Routes\Product\CategoryRoute`                          |
| 模块控制器  | `App\Modules\Product\CategoryController`                    |
| 领域控制器  | `App\Modules\Product\Category\CategoryController`           |
| 模型        | `App\Models\Product\Category`                               |
| 工厂        | `Database\Factories\Product\CategoryFactory`                |
| 领域 Action | `App\Modules\Product\Category\Actions\CreateCategoryAction` |

遵循这些命名约定后，大多数场景无需额外配置。

当项目结构逐渐复杂时，建议保持以下命名语义：

```text
模块名表达业务边界
领域名表达业务对象
Case 名表达具体动作
```

例如：

```text
Product              -> 商品模块
Category             -> 分类领域
Create               -> 创建动作
CreateCategoryAction -> 创建分类动作
```

## 什么时候显式指定

大多数场景下，遵循 Pin 的默认命名约定即可。

在以下情况下，建议显式指定模块、领域、`Action`、`Model` 或 `Factory`：

- 项目结构与默认约定不一致。
- 类名无法准确表达模块或领域。
- 某个 Route Case 需要绑定特殊 Action。
- 测试中需要临时替换 Model、Factory、Domain 或 Action。
- 旧项目迁移到 Pin，暂时无法调整现有命名结构。

可以通过以下方式覆盖或补充默认推导：

- 路由注册时显式传入 `handler`。
- 在 Route Case 上使用 `#[Action(...)]` 指定 Action。
- 在 Route Case 上使用 `#[Name(...)]` 或 `#[Middleware(...)]` 补充路由配置。
- 在测试链中使用 `withDomain()`、`withAction()`、`withFactory()`、`withModel()` 临时指定对象。
- 如果使用 `Pin\Support\Traits\HasModel`，可以通过 `withModel()` 方法指定模型。

::: info
优先遵循约定，仅在默认推导无法准确表达业务结构时使用显式配置。
:::
