---
title: 模型服务 | 模型
---

# 模型服务

模型服务是 Pin 面向模型写入流程提供的服务层约定，用于统一组织围绕 Model 的业务操作。

它将创建、更新、删除、分页查询等常见场景沉淀为一致的执行流程，并提供事务管理、生命周期扩展和结果封装能力。

::: info
模型服务更适合承载一次完整的“应用业务动作”，而不是替代 Model 本身。
Model 仍然负责数据结构、关联关系和基础查询能力；Service 则负责组织业务流程，把一次操作从输入处理、规则校验到持久化和后置动作串联起来。
:::

## 基础示例

::: code-group

```php [UserController]
class UserController extends Controller
{
    /**
     * @return ApiResponse<CreateResult>
     */
    public function create(CreateUserAction $action): ApiResponse
    {
        return $this->success($action->handle());
    }
}
```

```php [CreateUserAction]
class CreateUserAction extends Action
{
    public function __construct(protected UserService $service)
    {
    }

    public function handle(): CreateResult
    {
        $data = $this->validated();

        return $this->service->create($data);
    }
}
```

```php [UserService]
use Pin\Services\ModelService;

/**
 * @extends ModelService<User>
 */
class UserService extends ModelService
{
    protected function creating(array &$data): void
    {
        $data['username'] = strtolower($data['username']);
    }
}
```

:::

Pin 的服务层默认遵循约定优于配置。

当服务类与模型符合模块命名和目录约定时，Pin 会自动推导并关联对应的模型，无需额外配置。

如果服务需要操作其他模型，或不符合默认推导规则，可以通过 `withModel()` 显式指定模型：

```php
$service->withModel(User::class);
```

模型推导的具体规则可参考 [模块 & 推导](/guide/module#model)。

## 标准的 CRUD

模型服务为分页查询、创建、更新和删除提供了统一的执行流程，并将每个阶段拆分为可覆写的生命周期方法，方便在业务中按需扩展。

| 操作                    | 流程                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `pagination()` 分页查询 | -                                                            |
| `create()` 创建         | `saving` -> `creating` -> `create()` -> `created` -> `saved` |
| `update()` 更新         | `saving` -> `updating` -> `update()` -> `updated` -> `saved` |
| `delete()` 删除         | `deleting` -> `delete()` -> `deleted`                        |

模型服务生命周期遵循以下约定：

- `saving`、`creating` 和 `updating` 在数据写入前执行，可用于补全或修改待保存的数据。
- `created`、`updated`、`saved` 和 `deleted` 仅在对应**操作成功**完成后执行，可用于事件通知、缓存刷新、日志记录等后置处理。

::: info
这些方法属于 Service 生命周期方法，与 Eloquent Model Event 相互独立。
:::

### 创建数据

使用 `create()` 执行标准创建流程：

```php
$result = $service->create([
    'name' => 'Ada',
    'email' => 'ada@example.com',
]);
```

通过 `creating()` 在创建前补全字段、规范输入或设置默认值：

```php
protected function creating(array &$data): void
{
    $data['source'] ??= 'manual';
}
```

通过 `created()` 处理创建成功后的动作：

```php
protected function created($model, array $data): void
{
    // 例如写入关联数据、发送领域事件等
}
```

### 更新数据

使用 `update()` 更新模型。第一个参数可以是模型实例，也可以是模型 ID：

```php
$result = $service->update($userId, [
    'name' => 'Grace',
]);
```

通过 `updating()` 在更新前补全字段、规范输入或校验业务状态：

```php
protected function updating($model, array &$data): void
{
    if ($model->isAdministrator() && ! auth()->user()->isAdministrator()) {
        throw Errors::UpdateFailed->exception('禁止修改该管理员')
            ->withStatusCode(403);
    }
}
```

通过 `updated()` 处理更新成功后的动作：

```php
protected function updated($model, array $data): void
{
    // 例如写入关联数据、发送领域事件等
}
```

### 乐观锁

模型服务支持基于 `v` 字段的轻量级版本校验。

当更新数据包含 `v` 字段时，会自动启用版本校验：

- 当前版本与提交版本不一致时，抛出 `DataVersionMismatch` 异常。
- 校验通过后执行更新，并自动将 `v` 加 `1`。

```php
$service->update($userId, [
    'name' => 'Grace',
    'v' => 3,
]);
```

### 删除数据

使用 `delete()` 删除模型。参数可以是模型实例，也可以是模型 ID：

```php
$result = $service->delete($userId);
```

通过 `deleting()` 删除前校验业务状态

```php
protected function deleting($model): void
{
    if ($model->isAdministrator()) {
        throw Errors::DeleteFailed->exception('禁止删除该管理员')
            ->withStatusCode(403);
    }
}
```

通过 `deleted()` 处理删除成功后的动作：

```php
protected function deleted($model): void
{
    // 删除成功后清理关联资源
}
```

### 查询分页

使用 `pagination()` 获取分页结果：

```php
$pagination = $service->pagination();
```

你也可以传入查询规则或 `Queryable` 对象：

```php
$pagination = $service->pagination([
    'keyword' => 'like',
    'status' => 'IN',
]);
```

默认情况下，查询会按 `id` 倒序返回，并应用 `Queryable` 条件。

如果当前上下文关闭分页，服务会返回全部数据，并包装成统一的分页结构：

```php
$pagination = $service
    ->context('paging', false)
    ->pagination();
```

## 保存流程

模型服务提供创建和更新共享的保存生命周期。

```php
protected function saving($model, array &$data): void
{
    parent::saving($model, $data);

    // 继续处理保存前逻辑
}

protected function saved($model, array $data): void
{
    parent::saved($model, $data);

    // 继续处理保存后逻辑
}
```

#### `null` 处理

模型服务默认会在保存前对数据进行简单清洗，将 `null` 转换为空字符串，以保持输入数据的一致性。

如果需要保留 `null` 值，可以关闭该行为：

```php
$service->context(['convertNullToEmptyString' => false]);
```

也可以在服务内调整默认行为：

```php
protected bool $convertNullToEmptyString = false;
```

## 回调

创建、更新、删除方法都支持可选回调。回调会在标准流程完成后执行，并且仍处于对应操作的事务流程中。

如果回调抛出异常，事务会回滚。

```php
$service->create($data, function ($model, array $data): void {
    // 创建成功后的补充动作
});

$service->update($id, $data, function ($model, array $data): void {
    // 更新成功后的补充动作
});

$service->delete($id, function ($model): void {
    // 删除成功后的补充动作
});
```

## 上下文

模型服务支持[上下文](/digging-deeper/support#context)配置，用于控制一次调用中的行为：

```php
$service->context([
    'paging' => false,
    'convertNullToEmptyString' => false,
    'key' => 'value'
]);

$service->context('paging'); // false
$service->context('key'); // value
$service->context('missing', 'default'); // default
```

常用上下文：

| Key                        | 作用                                                |
| -------------------------- | --------------------------------------------------- |
| `paging`                   | 设置为 `false` 时，分页查询会返回全部数据           |
| `convertNullToEmptyString` | 设置为 `false` 时，保存前不再将 `null` 转为空字符串 |

## 操作结果 {#results}

模型服务写操作不会直接返回模型实例，而是返回对应的结果对象，用于描述本次操作的业务结果。

| 结果           | `toArray()`                               | `message()`             |
| -------------- | ----------------------------------------- | ----------------------- |
| `CreateResult` | `['id' => ...]`                           | `添加成功`              |
| `UpdateResult` | `['updated' => bool, 'v' => int 或 null]` | `更新成功` / `更新失败` |
| `DeleteResult` | `['deleted' => bool]`                     | `删除成功` / `删除失败` |

::: info
这些结果对象实现了 `Arrayable` 和 `JsonSerializable`。

调用方可以基于结果对象获取操作结果，并进一步完成响应构建、状态判断或资源转换等处理，
比如 [响应 message](/features/response#message)。

:::
