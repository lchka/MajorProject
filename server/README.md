# MajorProject

## Dependencies

### Production Dependencies

- **bcrypt** (^6.0.0) - Password hashing
- **dotenv** (^17.2.3) - Environment variable management
- **express** (^5.2.1) - Web framework
- **mongoose** (^9.1.5) - MongoDB object modeling
- **pg** (^8.17.2) - PostgreSQL client

### Development Dependencies

- **nodemon** (^3.1.11) - Auto-restart during development

## Weather UV Endpoint

- Route: `GET /api/weather/uv?lat=<latitude>&lon=<longitude>`
- Auth: Requires `Authorization: Bearer <token>`
- UV Provider: Open-Meteo (free, no API key required)
- Optional Env: `OPENWEATHERMAP_API_KEY` (used only to enrich temperature/condition fields)

Example:

```bash
curl "http://localhost:3000/api/weather/uv?lat=53.3498&lon=-6.2603" \
	-H "Authorization: Bearer <token>"
```

## Evaluations Archive Endpoint

- Route: `POST /api/evaluations`
- Auth: Requires `Authorization: Bearer <token>`
- Purpose: Persist an evaluation payload sent from client-side local overflow handling.

Expected body:

```json
{
	"evaluationContextId": "<uuid optional>",
	"profileId": "<uuid>",
	"productId": "<uuid>",
	"promptId": "<uuid optional>",
	"resultJson": {}
}
```

## Official Product Image Endpoint

- Route: `GET /api/product-image?productId=<uuid>`
- Auth: Requires `Authorization: Bearer <token>`
- Behavior:
	- Returns cached `product_image_official` when it exists.
	- If missing, backend fetches first Google image via SerpAPI, uploads to S3 at `products/{productId}/official.jpg`, stores `product_image_official`, and returns it.

Required environment variable:

- `SERPAPI_API_KEY`
