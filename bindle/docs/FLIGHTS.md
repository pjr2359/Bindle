# Flight search: Amadeus only

Flight results are provided **only by Amadeus**. If credentials are missing or Amadeus errors (e.g. rate limit), we return no flight results and the app shows a clear message—we do not use mock data.

## Amadeus for Developers (recommended for students)

[Amadeus Self-Service APIs](https://developers.amadeus.com/self-service) offer a **free test tier** with no student restriction.

### Setup

1. **Register**: [Create an account](https://developers.amadeus.com/register) and confirm your email.
2. **Create an app**: In “My Self-Service Workspace” create an app to get **API Key** and **API Secret**.
3. **Env**: Set these **server-side only** (e.g. in `.env`):
   - `AMADEUS_CLIENT_ID` = your API Key  
   - `AMADEUS_CLIENT_SECRET` = your API Secret  

We use the **test** base URL (`https://test.api.amadeus.com`). For production you’d switch to the production host and use your production credentials.

### Limits (test environment)

| Resource              | Limit              |
|-----------------------|--------------------|
| Flight Offers Search  | 2,000 POST + 2,000 GET / month free |
| Throughput            | 10 TPS, 1 request / 100 ms          |

Our app applies an **Amadeus rate limiter** (3 requests/second) for both location and flight-offers calls, and runs flight searches in **batches of 3**, so we stay under the 10 TPS cap and avoid 429 errors.

### Auth

Amadeus uses **OAuth2 client credentials**. The client in `lib/api/services/amadeusClient.ts` requests an access token and caches it until near expiry, then refreshes. No extra auth step is needed in your code.

### Booking links

The Flight Offers Search API does not return bookable deeplinks. So for every flight we show (prices, times, and carriers are **real** from Amadeus), the button is “View on Amadeus” and links to [amadeus.com](https://www.amadeus.com). For actual booking you’d integrate the [Flight Create Orders](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-create-orders) API.

**When is flight search run?** Only when both origin and destination have an IATA code from your location API (`Location.skyId`). If either is missing, we don't call the flight API for that pair ("skipped") and return no real results (mock may still be used as fallback). Your location/autocomplete API must return `skyId` (IATA) on every location—we use Amadeus reference-data locations for that.

**Airport grouping:** For a city search we get airports by city via Amadeus `GET /v1/reference-data/locations?keyword={cityName}&subType=AIRPORT`. If Amadeus isn't configured or the call fails, we use only the main location.

---

## When Amadeus isn’t available

If credentials are not set or the Amadeus call fails (e.g. 429), we return **no flight segments** for that pair. The results page shows: “We couldn’t load flight data. Amadeus may be temporarily unavailable, rate-limited, or not configured…”

---

## Flow in code

1. **`lib/api/flights.ts`**  
   - `performFlightSearch` uses Amadeus only when credentials are set; on error or missing credentials, returns `[]` (no mock).  
   - Amadeus is called only when both locations have `skyId` (IATA). Short-distance pairs (&lt; 100 km) skip flight search and return `[]`.

2. **`lib/api/services/amadeusClient.ts`**  
   - Token: `POST /v1/security/oauth2/token` (client_credentials).  
   - Flight search: `POST /v2/shopping/flight-offers` with `originLocationCode`, `destinationLocationCode`, `departureDate`, travelers, and `sources: ["GDS"]`.  
   - Locations: `GET /v1/reference-data/locations` for autocomplete and airport-by-city (used in `lib/utils/geo.ts` and `findNearbyTransportLocations`).

3. **Rate limiting** (`lib/api/rateLimiter.ts`)  
   - `amadeus`: 3 requests per second (locations + flight-offers share this).  
   - Flight searches in `lib/routing/engine.ts` run in batches of 3 to avoid bursting.

---

## Optional: production and quotas

- **Test**: Free monthly quota; use test host and test credentials.  
- **Production**: Same APIs with production credentials and [transaction fees](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/pricing); 40 TPS.  
- If you later add **Flight Create Orders** and create paid bookings, Amadeus can apply a **90% discount** on Flight Offers Search and Flight Offers Price in production.
