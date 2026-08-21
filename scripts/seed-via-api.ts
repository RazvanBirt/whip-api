/**
 * scripts/seed-via-api.ts
 *
 * Simple, deterministic API seed.
 *
 * Requirements:
 *   1. API is running.
 *   2. SEED_EMAIL belongs to an admin user.
 *   3. JWT_ACCESS_TTL is a real duration, e.g. "15m" (not "15").
 *
 * Run:
 *   BASE_URL="http://localhost:3000" \
 *   API_PREFIX="/api" \
 *   SEED_EMAIL="seed@local.dev" \
 *   SEED_PASSWORD="SeedPassword123!" \
 *   npx tsx scripts/seed-via-api.ts
 *
 * Optional if your model route differs:
 *   MODEL_CATALOG_PATH="/models/catalog/full"
 */

type FuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";
type Aspiration = "NA" | "Turbo" | null;

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const API_PREFIX = normalizePrefix(process.env.API_PREFIX ?? "/api");
const SEED_EMAIL = process.env.SEED_EMAIL ?? "seed@local.dev";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "SeedPassword123!";

let accessToken: string | null = null;
let resolvedCatalogPath: string | null = null;

// -----------------------------------------------------------------------------
// HTTP + auth
// -----------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    public method: "GET" | "POST",
    public path: string
  ) {
    super(`${method} ${path} -> ${status}\n${pretty(data)}`);
    this.name = "ApiError";
  }
}

function normalizePrefix(value: string) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function apiUrl(path: string) {
  return `${BASE_URL}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

function pretty(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function http<T = unknown>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  options: { auth?: boolean; retryAuth?: boolean } = {}
): Promise<T> {
  const auth = options.auth ?? true;
  const retryAuth = options.retryAuth ?? true;

  if (auth && !accessToken) {
    await login();
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      accept: "application/json",
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(auth && accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseResponse(response);

  // Retry exactly once with a brand-new access token.
  if (response.status === 401 && auth && retryAuth) {
    accessToken = null;
    await login();
    return http<T>(method, path, body, { auth: true, retryAuth: false });
  }

  if (!response.ok) {
    throw new ApiError(response.status, data, method, path);
  }

  return data as T;
}

function unwrapToken(response: unknown): string | null {
  if (!isRecord(response)) return null;

  const data = isRecord(response.data) ? response.data : null;
  const token =
    data?.accessToken ??
    response.accessToken ??
    data?.token ??
    response.token;

  return typeof token === "string" ? token : null;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
    return isRecord(payload) ? payload : null;
  } catch {
    return null;
  }
}

function validateAccessToken(token: string) {
  const payload = decodeJwt(token);
  if (!payload) return;

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const iat = typeof payload.iat === "number" ? payload.iat : null;

  if (exp !== null) {
    const remainingSeconds = exp - Date.now() / 1000;

    if (remainingSeconds <= 5) {
      throw new Error(
        [
          "The API returned an access token that is already expired or expires almost immediately.",
          'Set JWT_ACCESS_TTL="15m" (not JWT_ACCESS_TTL="15") in your API .env.',
          "Then restart the API.",
        ].join("\n")
      );
    }

    if (iat !== null && exp - iat < 60) {
      console.warn(`⚠️ access token lifetime is only ~${Math.round(exp - iat)} seconds`);
    }
  }

  if (payload.isAdmin === false) {
    throw new Error(
      [
        `${SEED_EMAIL} is not an admin.`,
        "Set isAdmin=true for the seed user before running this script.",
      ].join("\n")
    );
  }
}

async function login() {
  const response = await http(
    "POST",
    "/auth/login",
    { Email: SEED_EMAIL, Password: SEED_PASSWORD },
    { auth: false, retryAuth: false }
  );

  const token = unwrapToken(response);
  if (!token) throw new Error("POST /auth/login did not return an access token");

  validateAccessToken(token);
  accessToken = token;

  console.log(`✅ logged in as ${SEED_EMAIL}`);
}

// -----------------------------------------------------------------------------
// API helpers
// -----------------------------------------------------------------------------

function unwrapArray<T>(response: unknown, keys: string[]): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!isRecord(response)) return [];

  const containers: unknown[] = [
    response,
    response.data,
    response.result,
    response.payload,
  ];

  for (const container of containers) {
    if (Array.isArray(container)) return container as T[];
    if (!isRecord(container)) continue;

    for (const key of keys) {
      if (Array.isArray(container[key])) return container[key] as T[];
    }

    if (Array.isArray(container.items)) return container.items as T[];
    if (Array.isArray(container.results)) return container.results as T[];
  }

  return [];
}

function largePage(path: string) {
  return `${path}${path.includes("?") ? "&" : "?"}page=1&pageSize=1000&limit=1000`;
}

function isConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

// -----------------------------------------------------------------------------
// Seed model
// -----------------------------------------------------------------------------

type MakeSeed = {
  name: string;
  country: string;
};

type EngineSeed = {
  code: string;
  configuration: string | null;
  displacementCc: number | null;
  cylinders: number | null;
  fuelType: FuelType;
  aspiration: Aspiration;
  powerPs: number;
  torqueNm: number;
};

type ConfigSeed = {
  year: number;
  engineCode: string;
  fuelType: FuelType;
  transmissionType: string;
  drivetrainType: string;
  powerPs: number;
  torqueNm: number;
  zeroTo100: number;
};

type VersionSeed = {
  name: string;
  startYear: number;
  endYear: number;
  phaseName: "Pre-facelift" | "Facelift";
  configs: ConfigSeed[];
};

type BodyVariantSeed = {
  name: string;
  doors: number;
  wheelbaseMm: number;
  bodyTypeName: string;
  versions: VersionSeed[];
};

type GenerationSeed = {
  name: string;
  startYear: number;
  endYear: number;
  phases: { name: string; startYear: number; endYear: number }[];
  bodyVariants: BodyVariantSeed[];
};

type ModelSeedTree = {
  make: MakeSeed;
  model: { name: string };
  generations: GenerationSeed[];
};

type TransmissionApi = {
  id: string;
  type: string | null;
  gears: number | null;
};

type DrivetrainApi = {
  id: string;
  type: string | null;
};

type EngineApi = {
  code?: string | null;
};

type MakeApi = {
  name?: string | null;
};

// -----------------------------------------------------------------------------
// Compact data constructors
// -----------------------------------------------------------------------------

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function phases(startYear: number, endYear: number) {
  const middle = startYear + Math.floor((endYear - startYear) / 2);

  return [
    { name: "Pre-facelift", startYear, endYear: middle },
    { name: "Facelift", startYear: Math.min(middle + 1, endYear), endYear },
  ];
}

function version(input: {
  name: string;
  start: number;
  end: number;
  phase: "Pre-facelift" | "Facelift";
  engine: string;
  fuel: FuelType;
  transmission: string;
  drivetrain: string;
  power: number;
  torque: number;
  zeroTo100: number;
}): VersionSeed {
  return {
    name: input.name,
    startYear: input.start,
    endYear: input.end,
    phaseName: input.phase,
    configs: range(input.start, input.end).map((year) => ({
      year,
      engineCode: input.engine,
      fuelType: input.fuel,
      transmissionType: input.transmission,
      drivetrainType: input.drivetrain,
      powerPs: input.power,
      torqueNm: input.torque,
      zeroTo100: input.zeroTo100,
    })),
  };
}

function body(
  name: string,
  doors: number,
  wheelbaseMm: number,
  bodyTypeName: string,
  versions: VersionSeed[]
): BodyVariantSeed {
  return { name, doors, wheelbaseMm, bodyTypeName, versions };
}

function generation(
  name: string,
  startYear: number,
  endYear: number,
  bodyVariants: BodyVariantSeed[]
): GenerationSeed {
  return {
    name,
    startYear,
    endYear,
    phases: phases(startYear, endYear),
    bodyVariants,
  };
}

function car(
  makeName: string,
  country: string,
  modelName: string,
  generations: GenerationSeed[]
): ModelSeedTree {
  return {
    make: { name: makeName, country },
    model: { name: modelName },
    generations,
  };
}

function engine(
  code: string,
  configuration: string | null,
  displacementCc: number | null,
  cylinders: number | null,
  fuelType: FuelType,
  aspiration: Aspiration,
  powerPs: number,
  torqueNm: number
): EngineSeed {
  return {
    code,
    configuration,
    displacementCc,
    cylinders,
    fuelType,
    aspiration,
    powerPs,
    torqueNm,
  };
}

function enginePayload(item: EngineSeed) {
  return {
    code: item.code,
    configuration: item.configuration,
    displacementLiters:
      item.displacementCc === null ? null : +(item.displacementCc / 1000).toFixed(3),
    displacementCc: item.displacementCc,
    cylinders: item.cylinders,
    fuelType: item.fuelType,
    aspiration: item.aspiration,
    powerPs: item.powerPs,
    powerKw: Math.round(item.powerPs * 0.73549875),
    torqueNm: item.torqueNm,
    torqueLbft: Math.round(item.torqueNm * 0.737562149),
  };
}

// -----------------------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------------------

const TRANSMISSION_GEARS: Record<string, number> = {
  MT5: 5,
  MT6: 6,
  AT6: 6,
  AT8: 8,
  DCT7: 7,
  CVT: 0,
  eCVT: 0,
};

const DRIVETRAINS = [
  { type: "FWD", description: "Front-wheel drive" },
  { type: "RWD", description: "Rear-wheel drive" },
  { type: "AWD", description: "All-wheel drive" },
  { type: "4WD", description: "Selectable four-wheel drive" },
];

const ENGINES: EngineSeed[] = [
  engine("VW_EA211_1.5_TSI", "I4", 1498, 4, "Petrol", "Turbo", 150, 250),
  engine("VW_EA288_2.0_TDI", "I4", 1968, 4, "Diesel", "Turbo", 150, 340),
  engine("AUDI_2.0_TFSI", "I4", 1984, 4, "Petrol", "Turbo", 252, 370),
  engine("AUDI_2.0_TDI", "I4", 1968, 4, "Diesel", "Turbo", 190, 400),
  engine("BMW_B48_2.0T", "I4", 1998, 4, "Petrol", "Turbo", 184, 300),
  engine("BMW_B47_2.0D", "I4", 1995, 4, "Diesel", "Turbo", 190, 400),
  engine("MAZ_SKYACTIV_2.0G", "I4", 1998, 4, "Petrol", "NA", 165, 213),
  engine("MAZ_SKYACTIV_2.5G", "I4", 2488, 4, "Petrol", "NA", 190, 252),
  engine("TOY_HYBRID_1.8", "I4", 1798, 4, "Hybrid", "NA", 122, 200),
  engine("HON_L15_1.5T", "I4", 1498, 4, "Petrol", "Turbo", 182, 240),
  engine("HON_HYBRID_2.0", "I4", 1993, 4, "Hybrid", "NA", 184, 315),
  engine("FOR_1.0_ECOBOOST", "I3", 999, 3, "Petrol", "Turbo", 125, 200),
  engine("VOL_D4_2.0D", "I4", 1969, 4, "Diesel", "Turbo", 190, 400),
  engine("VOL_RECHARGE_PHEV", "I4", 1969, 4, "Hybrid", "Turbo", 340, 590),
  engine("REN_K9K_1.5_DCI", "I4", 1461, 4, "Diesel", "Turbo", 90, 220),
];

const CATALOG: ModelSeedTree[] = [
  car("Volkswagen", "Germany", "Golf", [
    generation("Golf Mk7", 2012, 2020, [
      body("Hatchback 5D", 5, 2637, "Hatchback", [
        version({
          name: "2.0 TDI",
          start: 2013,
          end: 2016,
          phase: "Pre-facelift",
          engine: "VW_EA288_2.0_TDI",
          fuel: "Diesel",
          transmission: "MT6",
          drivetrain: "FWD",
          power: 150,
          torque: 340,
          zeroTo100: 8.6,
        }),
        version({
          name: "1.5 TSI",
          start: 2017,
          end: 2020,
          phase: "Facelift",
          engine: "VW_EA211_1.5_TSI",
          fuel: "Petrol",
          transmission: "AT6",
          drivetrain: "FWD",
          power: 150,
          torque: 250,
          zeroTo100: 8.2,
        }),
      ]),
    ]),
  ]),

  car("Volkswagen", "Germany", "Passat", [
    generation("Passat B8", 2014, 2023, [
      body("Sedan 4D", 4, 2791, "Sedan", [
        version({
          name: "2.0 TDI",
          start: 2015,
          end: 2018,
          phase: "Pre-facelift",
          engine: "VW_EA288_2.0_TDI",
          fuel: "Diesel",
          transmission: "DCT7",
          drivetrain: "FWD",
          power: 150,
          torque: 340,
          zeroTo100: 8.7,
        }),
        version({
          name: "1.5 TSI",
          start: 2019,
          end: 2023,
          phase: "Facelift",
          engine: "VW_EA211_1.5_TSI",
          fuel: "Petrol",
          transmission: "DCT7",
          drivetrain: "FWD",
          power: 150,
          torque: 250,
          zeroTo100: 8.9,
        }),
      ]),
    ]),
  ]),

  car("Audi", "Germany", "A4", [
    generation("A4 B9", 2015, 2024, [
      body("Sedan 4D", 4, 2820, "Sedan", [
        version({
          name: "2.0 TFSI",
          start: 2016,
          end: 2019,
          phase: "Pre-facelift",
          engine: "AUDI_2.0_TFSI",
          fuel: "Petrol",
          transmission: "DCT7",
          drivetrain: "AWD",
          power: 252,
          torque: 370,
          zeroTo100: 5.8,
        }),
        version({
          name: "2.0 TDI",
          start: 2020,
          end: 2024,
          phase: "Facelift",
          engine: "AUDI_2.0_TDI",
          fuel: "Diesel",
          transmission: "DCT7",
          drivetrain: "FWD",
          power: 190,
          torque: 400,
          zeroTo100: 7.4,
        }),
      ]),
    ]),
  ]),

  car("Audi", "Germany", "Q5", [
    generation("Q5 FY", 2017, 2024, [
      body("SUV 5D", 5, 2819, "SUV", [
        version({
          name: "45 TFSI quattro",
          start: 2018,
          end: 2024,
          phase: "Facelift",
          engine: "AUDI_2.0_TFSI",
          fuel: "Petrol",
          transmission: "AT8",
          drivetrain: "AWD",
          power: 252,
          torque: 370,
          zeroTo100: 6.3,
        }),
      ]),
    ]),
  ]),

  car("BMW", "Germany", "3 Series", [
    generation("3 Series G20", 2019, 2025, [
      body("Sedan 4D", 4, 2851, "Sedan", [
        version({
          name: "320i",
          start: 2019,
          end: 2022,
          phase: "Pre-facelift",
          engine: "BMW_B48_2.0T",
          fuel: "Petrol",
          transmission: "AT8",
          drivetrain: "RWD",
          power: 184,
          torque: 300,
          zeroTo100: 7.1,
        }),
        version({
          name: "320d",
          start: 2023,
          end: 2025,
          phase: "Facelift",
          engine: "BMW_B47_2.0D",
          fuel: "Diesel",
          transmission: "AT8",
          drivetrain: "RWD",
          power: 190,
          torque: 400,
          zeroTo100: 6.8,
        }),
      ]),
    ]),
  ]),

  car("Mazda", "Japan", "MX-5", [
    generation("MX-5 ND", 2015, 2025, [
      body("Roadster 2D", 2, 2310, "Roadster", [
        version({
          name: "2.0 Skyactiv-G",
          start: 2016,
          end: 2025,
          phase: "Facelift",
          engine: "MAZ_SKYACTIV_2.0G",
          fuel: "Petrol",
          transmission: "MT6",
          drivetrain: "RWD",
          power: 165,
          torque: 213,
          zeroTo100: 7.3,
        }),
      ]),
    ]),
  ]),

  car("Mazda", "Japan", "Mazda3", [
    generation("Mazda3 BP", 2019, 2025, [
      body("Hatchback 5D", 5, 2725, "Hatchback", [
        version({
          name: "2.0 Skyactiv-G",
          start: 2019,
          end: 2022,
          phase: "Pre-facelift",
          engine: "MAZ_SKYACTIV_2.0G",
          fuel: "Petrol",
          transmission: "MT6",
          drivetrain: "FWD",
          power: 165,
          torque: 213,
          zeroTo100: 8.2,
        }),
        version({
          name: "2.5 Skyactiv-G AWD",
          start: 2023,
          end: 2025,
          phase: "Facelift",
          engine: "MAZ_SKYACTIV_2.5G",
          fuel: "Petrol",
          transmission: "AT6",
          drivetrain: "AWD",
          power: 190,
          torque: 252,
          zeroTo100: 7.8,
        }),
      ]),
    ]),
  ]),

  car("Toyota", "Japan", "Corolla", [
    generation("Corolla E210", 2018, 2025, [
      body("Hatchback 5D", 5, 2640, "Hatchback", [
        version({
          name: "1.8 Hybrid",
          start: 2019,
          end: 2025,
          phase: "Facelift",
          engine: "TOY_HYBRID_1.8",
          fuel: "Hybrid",
          transmission: "eCVT",
          drivetrain: "FWD",
          power: 122,
          torque: 200,
          zeroTo100: 10.9,
        }),
      ]),
    ]),
  ]),

  car("Honda", "Japan", "Civic", [
    generation("Civic X", 2015, 2021, [
      body("Hatchback 5D", 5, 2700, "Hatchback", [
        version({
          name: "1.5 VTEC Turbo",
          start: 2017,
          end: 2021,
          phase: "Facelift",
          engine: "HON_L15_1.5T",
          fuel: "Petrol",
          transmission: "MT6",
          drivetrain: "FWD",
          power: 182,
          torque: 240,
          zeroTo100: 8.2,
        }),
      ]),
    ]),
    generation("Civic XI", 2021, 2025, [
      body("Hatchback 5D", 5, 2734, "Hatchback", [
        version({
          name: "2.0 e:HEV",
          start: 2023,
          end: 2025,
          phase: "Facelift",
          engine: "HON_HYBRID_2.0",
          fuel: "Hybrid",
          transmission: "eCVT",
          drivetrain: "FWD",
          power: 184,
          torque: 315,
          zeroTo100: 7.8,
        }),
      ]),
    ]),
  ]),

  car("Ford", "USA", "Focus", [
    generation("Focus Mk4", 2018, 2025, [
      body("Hatchback 5D", 5, 2700, "Hatchback", [
        version({
          name: "1.0 EcoBoost",
          start: 2019,
          end: 2025,
          phase: "Facelift",
          engine: "FOR_1.0_ECOBOOST",
          fuel: "Petrol",
          transmission: "MT6",
          drivetrain: "FWD",
          power: 125,
          torque: 200,
          zeroTo100: 10.0,
        }),
      ]),
    ]),
  ]),

  car("Volvo", "Sweden", "XC60", [
    generation("XC60 II", 2017, 2025, [
      body("SUV 5D", 5, 2865, "SUV", [
        version({
          name: "D4 AWD",
          start: 2018,
          end: 2021,
          phase: "Pre-facelift",
          engine: "VOL_D4_2.0D",
          fuel: "Diesel",
          transmission: "AT8",
          drivetrain: "AWD",
          power: 190,
          torque: 400,
          zeroTo100: 8.4,
        }),
        version({
          name: "Recharge",
          start: 2022,
          end: 2025,
          phase: "Facelift",
          engine: "VOL_RECHARGE_PHEV",
          fuel: "Hybrid",
          transmission: "AT8",
          drivetrain: "AWD",
          power: 340,
          torque: 590,
          zeroTo100: 5.3,
        }),
      ]),
    ]),
  ]),

  car("Renault", "France", "Clio", [
    generation("Clio V", 2019, 2025, [
      body("Hatchback 5D", 5, 2583, "Hatchback", [
        version({
          name: "1.5 Blue dCi",
          start: 2019,
          end: 2022,
          phase: "Pre-facelift",
          engine: "REN_K9K_1.5_DCI",
          fuel: "Diesel",
          transmission: "MT6",
          drivetrain: "FWD",
          power: 90,
          torque: 220,
          zeroTo100: 11.2,
        }),
      ]),
    ]),
  ]),
];

// -----------------------------------------------------------------------------
// Derived data
// -----------------------------------------------------------------------------

function unique<T>(items: T[], key: (item: T) => string) {
  const result = new Map<string, T>();
  for (const item of items) result.set(key(item), item);
  return [...result.values()];
}

const EXTRA_MAKES: MakeSeed[] = [
  { name: "Mercedes-Benz", country: "Germany" },
  { name: "Porsche", country: "Germany" },
];

const MAKES = unique(
  [...CATALOG.map((item) => item.make), ...EXTRA_MAKES],
  (item) => item.name
);

function requiredTransmissionTypes() {
  return [
    ...new Set(
      CATALOG.flatMap((car) =>
        car.generations.flatMap((gen) =>
          gen.bodyVariants.flatMap((body) =>
            body.versions.flatMap((version) =>
              version.configs.map((config) => config.transmissionType)
            )
          )
        )
      )
    ),
  ];
}

function requiredDrivetrainTypes() {
  return [
    ...new Set(
      CATALOG.flatMap((car) =>
        car.generations.flatMap((gen) =>
          gen.bodyVariants.flatMap((body) =>
            body.versions.flatMap((version) =>
              version.configs.map((config) =>
                normalizeDrivetrainType(config.drivetrainType)
              )
            )
          )
        )
      )
    ),
  ];
}

function transmissionGears(type: string) {
  const gears = TRANSMISSION_GEARS[type];
  if (gears === undefined) throw new Error(`No gear count configured for ${type}`);
  return gears;
}

function normalizeDrivetrainType(type: string) {
  if (
    [
      "AWD_quattro",
      "AWD_xDrive",
      "AWD_4Matic",
      "AWD_Haldex",
      "AWD_Performance",
    ].includes(type)
  ) {
    return "AWD";
  }

  if (type === "RWD_Performance") return "RWD";
  return type;
}

function transmissionKey(type: string, gears: number | null | undefined) {
  return `${type}::${gears ?? 0}`;
}

// -----------------------------------------------------------------------------
// Base-table seed
// -----------------------------------------------------------------------------

async function ensureMakes() {
  const response = await http("GET", largePage("/makes"));
  const existing = unwrapArray<MakeApi>(response, ["makes"]);
  const seen = new Set(existing.map((item) => item.name).filter(Boolean));

  for (const make of MAKES) {
    if (seen.has(make.name)) {
      console.log(`↪️ make exists: ${make.name}`);
      continue;
    }

    try {
      // Current makes endpoint accepts an array.
      await http("POST", "/makes", [make]);
      seen.add(make.name);
      console.log(`✅ make: ${make.name}`);
    } catch (error) {
      if (!isConflict(error)) throw error;
      console.log(`↪️ make exists: ${make.name}`);
    }
  }
}

async function fetchTransmissions() {
  const response = await http("GET", largePage("/transmissions"));
  return unwrapArray<TransmissionApi>(response, ["transmissions"]);
}

async function ensureTransmissions() {
  const existing = await fetchTransmissions();
  const seen = new Set(
    existing
      .filter((item) => item.type)
      .map((item) => transmissionKey(item.type as string, item.gears))
  );

  for (const type of requiredTransmissionTypes()) {
    const gears = transmissionGears(type);
    const key = transmissionKey(type, gears);

    if (seen.has(key)) {
      console.log(`↪️ transmission exists: ${type} ${gears}`);
      continue;
    }

    try {
      await http("POST", "/transmissions", { type, gears });
      seen.add(key);
      console.log(`✅ transmission: ${type} ${gears}`);
    } catch (error) {
      if (!isConflict(error)) throw error;
      console.log(`↪️ transmission exists: ${type} ${gears}`);
    }
  }
}

async function fetchDrivetrains() {
  const response = await http("GET", largePage("/drivetrains"));
  return unwrapArray<DrivetrainApi>(response, ["drivetrains"]);
}

async function ensureDrivetrains() {
  const required = new Set(requiredDrivetrainTypes());
  const existing = await fetchDrivetrains();
  const seen = new Set(existing.map((item) => item.type).filter(Boolean));

  for (const drivetrain of DRIVETRAINS.filter((item) => required.has(item.type))) {
    if (seen.has(drivetrain.type)) {
      console.log(`↪️ drivetrain exists: ${drivetrain.type}`);
      continue;
    }

    try {
      await http("POST", "/drivetrains", drivetrain);
      seen.add(drivetrain.type);
      console.log(`✅ drivetrain: ${drivetrain.type}`);
    } catch (error) {
      if (!isConflict(error)) throw error;
      console.log(`↪️ drivetrain exists: ${drivetrain.type}`);
    }
  }
}

async function fetchEngines() {
  const response = await http("GET", largePage("/engines"));
  return unwrapArray<EngineApi>(response, ["engines"]);
}

async function ensureEngines() {
  const existing = await fetchEngines();
  const seen = new Set(existing.map((item) => item.code).filter(Boolean));

  for (const item of ENGINES) {
    if (seen.has(item.code)) {
      console.log(`↪️ engine exists: ${item.code}`);
      continue;
    }

    try {
      // Current engines endpoint accepts an array.
      await http("POST", "/engines", [enginePayload(item)]);
      seen.add(item.code);
      console.log(`✅ engine: ${item.code}`);
    } catch (error) {
      if (!isConflict(error)) throw error;
      console.log(`↪️ engine exists: ${item.code}`);
    }
  }
}

// -----------------------------------------------------------------------------
// Lookups + validation
// -----------------------------------------------------------------------------

async function transmissionMap() {
  const map = new Map<string, string>();

  for (const item of await fetchTransmissions()) {
    if (item.id && item.type) {
      map.set(transmissionKey(item.type, item.gears), item.id);
    }
  }

  return map;
}

async function drivetrainMap() {
  const map = new Map<string, string>();

  for (const item of await fetchDrivetrains()) {
    if (item.id && item.type) map.set(item.type, item.id);
  }

  return map;
}

async function validateSeedPrerequisites(
  transmissions: Map<string, string>,
  drivetrains: Map<string, string>
) {
  const engineCodes = new Set(
    (await fetchEngines())
      .map((item) => item.code)
      .filter((code): code is string => Boolean(code))
  );

  const missingEngines = ENGINES
    .map((item) => item.code)
    .filter((code) => !engineCodes.has(code));

  const missingTransmissions = requiredTransmissionTypes()
    .map((type) => transmissionKey(type, transmissionGears(type)))
    .filter((key) => !transmissions.has(key));

  const missingDrivetrains = requiredDrivetrainTypes()
    .filter((type) => !drivetrains.has(type));

  if (
    missingEngines.length ||
    missingTransmissions.length ||
    missingDrivetrains.length
  ) {
    throw new Error(
      [
        "Seed prerequisite validation failed.",
        missingEngines.length
          ? `Missing engines: ${missingEngines.join(", ")}`
          : "",
        missingTransmissions.length
          ? `Missing transmissions: ${missingTransmissions.join(", ")}`
          : "",
        missingDrivetrains.length
          ? `Missing drivetrains: ${missingDrivetrains.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
}

// -----------------------------------------------------------------------------
// Full model payload
// -----------------------------------------------------------------------------

function toApiPayload(
  tree: ModelSeedTree,
  transmissions: Map<string, string>,
  drivetrains: Map<string, string>
) {
  return {
    make: tree.make,
    model: tree.model,

    generations: tree.generations.map((gen) => ({
      name: gen.name,
      startYear: gen.startYear,
      endYear: gen.endYear,
      phases: gen.phases,

      bodyVariants: gen.bodyVariants.map((body) => ({
        name: body.name,
        doors: body.doors,
        wheelbaseMm: body.wheelbaseMm,
        bodyType: { name: body.bodyTypeName },

        versions: body.versions.map((version) => ({
          name: version.name,
          startYear: version.startYear,
          endYear: version.endYear,
          phaseName: version.phaseName,

          configs: version.configs.map((config) => {
            const txKey = transmissionKey(
              config.transmissionType,
              transmissionGears(config.transmissionType)
            );

            const drivetrainType = normalizeDrivetrainType(config.drivetrainType);
            const transmissionId = transmissions.get(txKey);
            const drivetrainId = drivetrains.get(drivetrainType);

            if (!transmissionId) {
              throw new Error(`Missing transmission id for ${txKey}`);
            }

            if (!drivetrainId) {
              throw new Error(`Missing drivetrain id for ${drivetrainType}`);
            }

            return {
              year: config.year,
              engine: { code: config.engineCode },
              transmission: { id: transmissionId },
              drivetrain: { id: drivetrainId },
              spec: {
                fuelType: config.fuelType,
                powerPsOverride: config.powerPs,
                torqueNmOverride: config.torqueNm,
                zeroTo100: config.zeroTo100,
              },
            };
          }),
        })),
      })),
    })),
  };
}

// -----------------------------------------------------------------------------
// Mixed old/new catalog route support
// -----------------------------------------------------------------------------

function catalogPaths() {
  const configured = process.env.MODEL_CATALOG_PATH?.trim();

  return [
    configured,
    "/models/catalog/full",
    "/models/catalog/models/full",
  ].filter(
    (value, index, all): value is string =>
      Boolean(value) && all.indexOf(value) === index
  );
}

async function postCatalog(payload: unknown) {
  if (resolvedCatalogPath) {
    return http("POST", resolvedCatalogPath, payload);
  }

  const paths = catalogPaths();

  for (const path of paths) {
    try {
      const response = await http("POST", path, payload);
      resolvedCatalogPath = path;
      console.log(`ℹ️ catalog endpoint: ${path}`);
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }

  throw new Error(
    `Could not find catalog endpoint. Tried: ${paths.join(", ")}`
  );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding via API", {
    BASE_URL,
    API_PREFIX,
    models: CATALOG.length,
    engines: ENGINES.length,
  });

  await login();

  console.log("\n1/5 Makes");
  await ensureMakes();

  console.log("\n2/5 Transmissions");
  await ensureTransmissions();

  console.log("\n3/5 Drivetrains");
  await ensureDrivetrains();

  console.log("\n4/5 Engines");
  await ensureEngines();

  const transmissions = await transmissionMap();
  const drivetrains = await drivetrainMap();

  await validateSeedPrerequisites(transmissions, drivetrains);

  console.log("\n5/5 Models");

  let completed = 0;

  for (const tree of CATALOG) {
    try {
      await postCatalog(toApiPayload(tree, transmissions, drivetrains));
    } catch (error) {
      throw new Error(
        `Failed seeding ${tree.make.name} ${tree.model.name}\n${message(error)}`
      );
    }

    completed++;
    console.log(
      `✅ ${tree.make.name} ${tree.model.name} (${completed}/${CATALOG.length})`
    );
  }

  console.log("\n🎉 Seed complete", {
    makes: MAKES.length,
    transmissions: requiredTransmissionTypes().length,
    drivetrains: requiredDrivetrainTypes().length,
    engines: ENGINES.length,
    models: completed,
    catalogEndpoint: resolvedCatalogPath,
  });
}

main().catch((error) => {
  console.error("\n❌ Seed failed");

  if (error instanceof ApiError && error.status === 403) {
    console.error(
      [
        `${SEED_EMAIL} logged in successfully, but does not have permission to seed.`,
        "Set isAdmin=true for this user and run the script again.",
      ].join("\n")
    );
  } else if (error instanceof ApiError && error.status === 401) {
    console.error(
      [
        error.message,
        "",
        'Check JWT_ACCESS_TTL. Use a duration such as JWT_ACCESS_TTL="15m".',
        "Restart the API after changing it.",
      ].join("\n")
    );
  } else {
    console.error(message(error));
  }

  process.exit(1);
});