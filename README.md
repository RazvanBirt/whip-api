## API Endpoints

| Method | Endpoint                    | Auth Required |
| ------ | --------------------------- | ------------- |
| POST   | `/api/auth/register`        | No            |
| POST   | `/api/auth/login`           | No            |
| POST   | `/api/auth/refresh`         | No            |
| POST   | `/api/auth/logout`          | No            |
| POST   | `/api/auth/forgot-password` | No            |
| POST   | `/api/auth/reset-password`  | No            |
| POST   | `/api/auth/change-password` | Yes           |

| Method | Endpoint                | Auth Required |
| ------ | ----------------------- | ------------- |
| POST   | `/api/makes`            | Yes           |
| POST   | `/api/makes/with-image` | Yes           |
| GET    | `/api/makes`            | No            |
| GET    | `/api/makes/:id`        | No            |
| PATCH  | `/api/makes/:id`        | Yes           |
| DELETE | `/api/makes`            | Yes           |

| Method | Endpoint                   | Auth Required            |
| ------ | -------------------------- | ------------------------ |
| POST   | `/api/models`              | No auth middleware shown |
| GET    | `/api/models`              | No                       |
| GET    | `/api/models/:id`          | No                       |
| PATCH  | `/api/models/:id`          | No auth middleware shown |
| DELETE | `/api/models`              | No auth middleware shown |
| POST   | `/api/models/catalog/full` | No auth middleware shown |

| Method | Endpoint              | Auth Required |
| ------ | --------------------- | ------------- |
| POST   | `/api/body-types`     | Yes           |
| GET    | `/api/body-types`     | No            |
| GET    | `/api/body-types/:id` | No            |
| PATCH  | `/api/body-types/:id` | Yes           |
| DELETE | `/api/body-types`     | Yes           |

| Method | Endpoint           | Auth Required            |
| ------ | ------------------ | ------------------------ |
| POST   | `/api/engines`     | No auth middleware shown |
| GET    | `/api/engines`     | No                       |
| GET    | `/api/engines/:id` | No                       |
| PATCH  | `/api/engines/:id` | No auth middleware shown |
| DELETE | `/api/engines`     | No auth middleware shown |

| Method | Endpoint                 | Auth Required            |
| ------ | ------------------------ | ------------------------ |
| POST   | `/api/transmissions`     | No auth middleware shown |
| GET    | `/api/transmissions`     | No                       |
| GET    | `/api/transmissions/:id` | No                       |
| PATCH  | `/api/transmissions/:id` | No auth middleware shown |
| DELETE | `/api/transmissions`     | No auth middleware shown |

| Method | Endpoint               | Auth Required            |
| ------ | ---------------------- | ------------------------ |
| POST   | `/api/drivetrains`     | No auth middleware shown |
| GET    | `/api/drivetrains`     | No                       |
| GET    | `/api/drivetrains/:id` | No                       |
| PATCH  | `/api/drivetrains/:id` | No auth middleware shown |
| DELETE | `/api/drivetrains`     | No auth middleware shown |

| Method | Endpoint          | Auth Required |
| ------ | ----------------- | ------------- |
| GET    | `/api/garage`     | Yes           |
| POST   | `/api/garage`     | Yes           |
| GET    | `/api/garage/:id` | Yes           |
| PATCH  | `/api/garage/:id` | Yes           |
| DELETE | `/api/garage/:id` | Yes           |
