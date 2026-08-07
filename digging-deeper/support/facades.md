## Facades 入口

`src/Support/Facades` 提供 Pin 核心服务的 Laravel Facade 入口。

| Facade         | 对应类                   | 容器绑定            |
| -------------- | ------------------------ | ------------------- |
| `Actor`        | `Pin\Log\Actor`          | `pin.log.actor`     |
| `Aes`          | `Pin\Crypt\Aes`          | `pin.crypt.aes`     |
| `HashCache`    | `Pin\Cache\HashCache`    | `pin.cache.hash`    |
| `Password`     | `Pin\Password\Password`  | `pin.password`      |
| `Rsa`          | `Pin\Crypt\Rsa`          | `pin.crypt.rsa`     |
| `RuntimeCache` | `Pin\Cache\RuntimeCache` | `pin.cache.runtime` |
| `Token`        | `Pin\Token\TokenManager` | `pin.token`         |
| `Tree`         | `Pin\Tree\Tree`          | `pin.tree`          |
