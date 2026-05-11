And if you want the **cleaned/fixed route version** for the README instead, use this:

````md
## API Endpoints

Base URL:

```txt
/api
```

| Method | Endpoint                | Auth Required? |
| ------ | ----------------------- | -------------- |
| POST   | `/auth/register`        | No             |
| POST   | `/auth/login`           | No             |
| POST   | `/auth/refresh`         | No             |
| POST   | `/auth/logout`          | No             |
| POST   | `/auth/forgot-password` | No             |
| POST   | `/auth/reset-password`  | No             |
| POST   | `/auth/change-password` | Yes            |
| POST   | `/makes`                | Yes            |
| POST   | `/makes/with-image`     | Yes            |
| GET    | `/makes`                | No             |
| GET    | `/makes/:id`            | No             |
| PATCH  | `/makes/:id`            | Yes            |
| DELETE | `/makes`                | Yes            |
| POST   | `/models`               | No             |
| GET    | `/models`               | No             |
| GET    | `/models/:id`           | No             |
| PATCH  | `/models/:id`           | No             |
| DELETE | `/models`               | No             |
| POST   | `/models/catalog/full`  | No             |
| POST   | `/body-types`           | Yes            |
| GET    | `/body-types`           | No             |
| GET    | `/body-types/:id`       | No             |
| PATCH  | `/body-types/:id`       | Yes            |
| DELETE | `/body-types`           | Yes            |
| POST   | `/engines`              | No             |
| GET    | `/engines`              | No             |
| GET    | `/engines/:id`          | No             |
| PATCH  | `/engines/:id`          | No             |
| DELETE | `/engines`              | No             |
| POST   | `/transmissions`        | No             |
| GET    | `/transmissions`        | No             |
| GET    | `/transmissions/:id`    | No             |
| PATCH  | `/transmissions/:id`    | No             |
| DELETE | `/transmissions`        | No             |

```

```
````
