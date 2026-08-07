---
title: 查询构建 | 模型
---

# 查询构建

Pin 的查询构建用于把请求参数转换为 Eloquent 查询条件。

开发者只需声明可查询字段及查询方式，Pin 会负责解析查询描述，并生成对应的 Eloquent 查询条件。

## 快速开始

::: code-group

```php [声明查询规则]
use Pin\Actions\Action;
use Pin\Validation\QueryableRules;

class ListLogsAction extends Action
{
    public function rules(): array
    {
        return [
            'username' => QueryableRules::ns('uid,username'),
            'event' => QueryableRules::in('string'),
            'subject' => QueryableRules::ns('subject_id,subject_name'),
            'created_at' => QueryableRules::range(),
            'sort' => ['nullable', 'string'],
        ];
    }
}
```

```php [应用查询规则]
public function index(ListLogsAction $action)
{
    $logs = Log::queryable($action->queryable())
        ->sort(request('sort'), ['id', 'created_at'])
        ->pagination();

    return $this->success($logs);
}
```

:::

例如请求：

```http
GET /api/system/logs?
username=1234
&event=created,updated
&subject=M2026123456
&created_at=2026-01-01,
&sort=-created_at
```

将生成以下查询语义：

```sql
uid = 1234
and event in ('created', 'updated')
and subject_name like '%M2026123456%'
and created_at >= '2026-01-01'
order by created_at desc
```

::: info
`sort` 只做排序，没有声明为 `QueryableRules`，因此不会参与筛选条件生成。
:::

::: tip
筛选条件交给 `queryable()`，排序交给 `sort()`，分页交给 `pagination()`。
:::

## 构建 Queryable {#make}

`Queryable` 是标准化后的查询条件集合。它可以来自验证规则、当前请求，也可以来自应用内部组装的数据。

### 从验证规则构建 {#from-rules}

推荐在面向接口的列表查询中使用这种方式。参数校验、可查询字段和查询语义都在同一份 `rules()` 中声明。

```php
use Pin\Models\Queryable\Queryable;
use Pin\Validation\QueryableRules;

$rules = [
    'keyword' => QueryableRules::ns('id,username,realname'),
    'status' => QueryableRules::inNumeric(),
    'created_at' => QueryableRules::range(),
];

// 先验证
$payload = $request->validate($rules);

// 不验证
// $payload = $request->query();

$queryable = Queryable::fromRules($rules, $payload);
```

然后应用到模型查询：

```php
User::queryable($queryable)
    ->pagination();
```

::: info

如果使用 Pin `Action`，可以直接调用 `$this->queryable()` 或 `$action->queryable()`，Pin 会基于 Action 的验证规则和当前输入构建查询对象。

如果使用模型服务，分页列表查询可以直接调用 `$service->pagination($rules)`。
:::

### 从请求构建

当查询字段与操作符已经由调用方确定，也可以直接从当前请求构建：

```php
use Pin\Models\Queryable\Queryable;
use Pin\Models\Queryable\QueryableType;

$queryable = Queryable::fromRequest([
    'keyword' => 'ns:id,username',
    'status' => QueryableType::InNumeric,
    'created_at' => QueryableType::Range,
]);
```

`fromRequest()` 默认读取当前 HTTP 请求的查询参数。也可以传入指定的 `Request` 实例：

```php
$queryable = Queryable::fromRequest($types, $request);
```

::: tip
这种方式不经过 Laravel validation。面向外部请求的接口，仍建议优先从验证规则构建。
:::

### 从自定义 Payload 构建

当查询条件来自应用内部，而不是当前 HTTP 请求时，可以显式传入 payload 与类型映射。

```php
use Pin\Models\Queryable\Queryable;

$queryable = Queryable::fromPayload(
    ['keyword' => 'alice', 'status' => [1, 2]],
    ['keyword' => 'like', 'status' => 'IN'],
);
```

第一个参数是输入数据，第二个参数是字段到查询类型的映射。

## 查询类型

查询类型使用 `QueryableType` 描述操作符。

小写操作符按字符串语义处理，大写操作符按数值语义处理。

在日常业务代码中，通常不需要手写操作符，直接使用 [QueryableRules](/features/validation#queryable) 更清晰。

| 操作符       | QueryableRules                 | 查询语义              |
| ------------ | ------------------------------ | --------------------- |
| `eq`         | `eq()`                         | 字符串等值            |
| `EQ`         | `eqNumeric()`                  | 数值等值              |
| `like`       | `like()`                       | 包含匹配              |
| `startsWith` | `startsWith()`                 | 前缀匹配              |
| `endsWith`   | `endsWith()`                   | 后缀匹配              |
| `gt` / `gte` | `gt()` / `gte()`               | 字符串大于 / 大于等于 |
| `GT` / `GTE` | `gtNumeric()` / `gteNumeric()` | 数值大于 / 大于等于   |
| `lt` / `lte` | `lt()` / `lte()`               | 字符串小于 / 小于等于 |
| `LT` / `LTE` | `ltNumeric()` / `lteNumeric()` | 数值小于 / 小于等于   |
| `in`         | `in()`                         | 字符串集合匹配        |
| `IN`         | `inNumeric()`                  | 数值集合匹配          |
| `range`      | `range()`                      | 字符串区间            |
| `RANGE`      | `rangeNumeric()`               | 数值区间              |
| `ns:id,name` | `ns('id,name')`                | 智能搜索              |

### 等值查询

等值查询生成 `where field = value`。

```php
use Pin\Validation\QueryableRules;

return [
    'username' => QueryableRules::eq(),
    'status' => QueryableRules::eqNumeric(),
];
```

请求：

```http
GET /users?username=alice&status=1
```

等价查询：

```php
$query
    ->where('username', 'alice')
    ->where('status', 1);
```

### 模糊查询

模糊查询会根据操作符补全通配符。

```php
return [
    'username' => QueryableRules::like(),
    'email' => QueryableRules::endsWith(),
];
```

对应关系：

| 方法           | 查询值    |
| -------------- | --------- |
| `like()`       | `%value%` |
| `startsWith()` | `value%`  |
| `endsWith()`   | `%value`  |

### 比较查询

比较查询适合日期、时间、金额、数量等可排序字段。

```php
return [
    'created_at' => QueryableRules::gte(),
    'amount' => QueryableRules::ltNumeric(),
];
```

请求：

```http
GET /orders?created_at=2026-01-01&amount=1000
```

等价查询：

```php
$query
    ->where('created_at', '>=', '2026-01-01')
    ->where('amount', '<', 1000);
```

### IN 查询

`in()` 与 `inNumeric()` 生成 `whereIn` 条件。

默认情况下，输入值按数组验证：

```php
return [
    'status' => QueryableRules::in(),
    'ids' => QueryableRules::inNumeric(),
];
```

请求：

```http
GET /users?status[]=enabled&status[]=disabled&ids[]=1&ids[]=2
```

等价查询：

```php
$query
    ->whereIn('status', ['enabled', 'disabled'])
    ->whereIn('ids', [1, 2]);
```

如果前端使用逗号分隔字符串，可以把验证类型改为 `string`：

```php
return [
    'ids' => QueryableRules::inNumeric('string'),
];
```

请求：

```http
GET /users?ids=1,2,3
```

### 区间查询

`range()` 与 `rangeNumeric()` 使用 `start,end` 表达区间。

```php
return [
    'created_at' => QueryableRules::range(),
    'amount' => QueryableRules::rangeNumeric(),
];
```

请求值与查询关系：

| 请求值                  | 查询效果                           |
| ----------------------- | ---------------------------------- |
| `2026-01-01,2026-01-31` | `>= 2026-01-01` 且 `<= 2026-01-31` |
| `2026-01-01,`           | 只应用 `>= 2026-01-01`             |
| `,2026-01-31`           | 只应用 `<= 2026-01-31`             |

数值区间的请求格式仍然是字符串，应用查询时会把边界值转换为数值。

### 智能搜索 {#ns}

智能搜索适合一个输入框同时支持 ID 与名称搜索。

```php
return [
    'keyword' => QueryableRules::ns('id,username,realname'),
];
```

字段规则：

- 第一个字段用于数字输入的精确匹配。
- 第二个及后续字段用于文本输入的包含匹配。
- 字段可以用 `,` 或 `|` 分隔。

请求：

```http
GET /users?keyword=10001
```

等价查询：

```php
$query->where('id', 10001);
```

请求：

```http
GET /users?keyword=alice
```

等价查询：

```php
$query->where(function ($query) {
    $query
        ->where('username', 'like', '%alice%')
        ->orWhere('realname', 'like', '%alice%');
});
```

::: tip
`ns('id,username,realname')` 是列表页搜索框的推荐形态：用户输入数字时查 ID，输入文本时查名称类字段。
:::

### 查询类型参数

当规则中带有参数时，参数表示实际参与查询的字段名，请求参数名则只负责接收输入值。

例如：

```php
'keyword' => 'like:username',
```

表示接口接收 `keyword` 参数，但查询时会将该值作用到 `username` 字段上：

```http
GET /articles?keyword=alice
```

等价于按如下条件查询：

```php
where('username', 'like', '%alice%')
```

也就是说，`keyword` 是请求参数名，`username` 是查询字段名。

模糊查询类型（`like`、`startsWith`、`endsWith`）支持多个字段：

```php
'keyword' => 'like:title,content',
```

表示使用 `keyword` 的值匹配 `title` 或 `content` 字段。

## 字段映射

在应用查询前，Pin 会调用模型的 `transformQueryableColumn()` 转换字段名。

默认行为是把请求字段转为 `snake_case`：

```php
createdAt -> created_at
```

如果接口字段与数据库字段不一致，可以在模型中覆写该方法：

```php
use Pin\Models\Model;

class User extends Model
{
    public function transformQueryableColumn(string $column): string
    {
        return match ($column) {
            'owner' => 'created_by',
            default => parent::transformQueryableColumn($column),
        };
    }
}
```

::: info
`ns()` 中传入的字段是明确的查询字段，例如 `ns('id,username')`。这类字段会直接用于智能搜索，请写成模型查询能够识别的字段名。
:::

## 空值处理

查询字段为空时，Pin 会跳过该条件，不会生成无效的 `where`。

以下情况不会生成查询条件：

- `null`
- 空字符串
- 空数组

例如：

```http
GET /users?keyword=&status[]=enabled
```

如果 `keyword` 为空，则只会应用 `status` 条件。

## 排序、分页与聚合

查询 Builder 宏可以组合使用。

覆盖列表接口中常见的筛选、排序、分页与统计列。

```php
User::queryable($queryable)
    ->sort('username,-created_at', ['username', 'created_at'])
    ->pagination();
```

常用宏：

| 方法               | 说明                                    |
| ------------------ | --------------------------------------- |
| `queryable()`      | 应用 `Queryable` 查询条件               |
| `sort()`           | 按白名单字段排序，字段前加 `-` 表示降序 |
| `pagination()`     | 返回 Pin 分页结果                       |
| `addSelectCount()` | 增加计数字段                            |
| `addSelectSum()`   | 增加求和字段                            |
| `addSelectAvg()`   | 增加平均值字段                          |
| `addSelectMax()`   | 增加最大值字段                          |
| `addSelectMin()`   | 增加最小值字段                          |
