## 服务提供者

`Pin\Support\ServiceProvider` 扩展了 Laravel `ServiceProvider` 的配置合并行为。

与 Laravel 默认的 `mergeConfigFrom()` 不同，Pin 会递归合并配置数组，因此业务项目可以只覆盖需要修改的配置项，而无需复制整个配置文件。

```php
use Pin\Support\ServiceProvider;

class TokenServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/pin/token.php', 'pin.token');
    }
}
```

包提供以下默认配置：

```php
return [
    'drivers' => [
        'session' => [
            'expires' => 7200,
            'refresh_before' => 300,
        ],
    ],
];
```

业务项目只需覆盖需要修改的配置：

```php
return [
    'drivers' => [
        'session' => [
            'expires' => 3600,
        ],
    ],
];
```

最终配置为：

```php
return [
    'drivers' => [
        'session' => [
            'expires' => 3600, // [!code highlight]
            'refresh_before' => 300,
        ],
    ],
];
```
