/**
 * Curated “realistic” seed script (via API) — NO randomness.
 *
 * - Seeds makes (protected)
 * - Seeds transmissions/drivetrains (public) safely (GET first, POST only missing)
 * - Seeds engines (public) from a curated list
 * - Upserts a curated catalog pack (makes -> models -> generations -> body variants -> trims -> configs)
 * - Reuses transmission/drivetrain IDs so unique constraints won't be violated
 *
 * Run (Node 18+):
 *   API_PREFIX="/api" BASE_URL="http://localhost:3000" node --loader ts-node/esm scripts/seed-via-api.ts
 *
 * Optional env (auth only):
 *   SEED_EMAIL="seed@local.dev"
 *   SEED_PASSWORD="SeedPassword123!"
 *   SEED_USERNAME="Seeder"
 */

type Json = Record<string, any>;

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_PREFIX = process.env.API_PREFIX ?? "/api";

function url(path: string) {
  const pfx = API_PREFIX.endsWith("/") ? API_PREFIX.slice(0, -1) : API_PREFIX;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${pfx}${p}`;
}

async function http(method: string, path: string, body?: any, token?: string) {
  const res = await fetch(url(path), {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}\n${JSON.stringify(data, null, 2)}`);
  }
  return data;
}

/** best-effort create; logs and continues on error */
async function tryPost(path: string, body: any, token?: string, label?: string) {
  try {
    const out = await http("POST", path, body, token);
    console.log(`✅ ${label ?? path}`);
    return out;
  } catch (e: any) {
    console.warn(`⚠️  ${label ?? path} failed (continuing)`);
    console.warn(String(e?.message ?? e));
    return null;
  }
}

async function ensureAuth(): Promise<string> {
  const email = process.env.SEED_EMAIL ?? "seed@local.dev";
  const password = process.env.SEED_PASSWORD ?? "SeedPassword123!";
  const userName = process.env.SEED_USERNAME ?? "Seeder";

  try {
    const reg = await http("POST", "/auth/register", { UserName: userName, Email: email, Password: password });
    const token = reg?.data?.accessToken ?? reg?.accessToken ?? reg?.token ?? reg?.data?.token;
    if (!token) throw new Error("No accessToken returned from /auth/register");
    console.log("✅ registered seed user");
    return token;
  } catch {
    const login = await http("POST", "/auth/login", { Email: email, Password: password });
    const token = login?.data?.accessToken ?? login?.accessToken ?? login?.token ?? login?.data?.token;
    if (!token) throw new Error("No accessToken returned from /auth/login");
    console.log("✅ logged in seed user");
    return token;
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

// -------------------- Your endpoints (double-mount behavior) --------------------

const endpoints = {
  makesCreate: "/makes/makes",
  enginesCreate: "/engines/engines",
  transmissionsCreate: "/transmissions/transmissions",
  transmissionsGetAll: "/transmissions/transmissions",
  drivetrainsCreate: "/drivetrains/drivetrains",
  drivetrainsGetAll: "/drivetrains/drivetrains",
  upsertFullModel: "/models/catalog/models/full",
};

type Transmission = { id: string; type: string | null; gears: number | null };
type Drivetrain = { id: string; type: string | null; description: string | null };

async function fetchTransmissions(): Promise<Transmission[]> {
  const res = await http("GET", endpoints.transmissionsGetAll);
  return Array.isArray(res?.transmissions) ? res.transmissions : [];
}

async function fetchDrivetrains(): Promise<Drivetrain[]> {
  const res = await http("GET", endpoints.drivetrainsGetAll);
  return Array.isArray(res?.drivetrains) ? res.drivetrains : [];
}

async function buildTransmissionMap(): Promise<Map<string, string>> {
  const list = await fetchTransmissions();
  const m = new Map<string, string>();
  for (const t of list) if (t?.type && t?.id) m.set(t.type, t.id);
  return m;
}

async function buildDrivetrainMap(): Promise<Map<string, string>> {
  const list = await fetchDrivetrains();
  const m = new Map<string, string>();
  for (const d of list) if (d?.type && d?.id) m.set(d.type, d.id);
  return m;
}

/** safer than createMany: GET first, POST missing one-by-one */
async function ensureTransmissions(desired: { type: string; gears: number }[]) {
  const existing = await fetchTransmissions();
  const seen = new Set(existing.map((t) => t.type).filter(Boolean) as string[]);
  for (const t of desired) {
    if (seen.has(t.type)) continue;
    try {
      await http("POST", endpoints.transmissionsCreate, { type: t.type, gears: t.gears });
      console.log(`✅ seeded transmission ${t.type}`);
      seen.add(t.type);
    } catch (e: any) {
      console.warn(`⚠️ transmission ${t.type} create failed (continuing)`);
      console.warn(String(e?.message ?? e));
    }
  }
}

async function ensureDrivetrains(desired: { type: string; description: string }[]) {
  const existing = await fetchDrivetrains();
  const seen = new Set(existing.map((d) => d.type).filter(Boolean) as string[]);
  for (const d of desired) {
    if (seen.has(d.type)) continue;
    try {
      await http("POST", endpoints.drivetrainsCreate, { type: d.type, description: d.description });
      console.log(`✅ seeded drivetrain ${d.type}`);
      seen.add(d.type);
    } catch (e: any) {
      console.warn(`⚠️ drivetrain ${d.type} create failed (continuing)`);
      console.warn(String(e?.message ?? e));
    }
  }
}

// -------------------- Catalog seeds --------------------

type MakeSeed = { name: string; country: string; code: string };

const MAKES: MakeSeed[] = [
  { name: "Volkswagen", country: "Germany", code: "VW" },
  { name: "Audi", country: "Germany", code: "AUDI" },
  { name: "BMW", country: "Germany", code: "BMW" },
  { name: "Mercedes-Benz", country: "Germany", code: "MB" },
  { name: "Porsche", country: "Germany", code: "POR" },

  { name: "Toyota", country: "Japan", code: "TOY" },
  { name: "Honda", country: "Japan", code: "HON" },
  { name: "Mazda", country: "Japan", code: "MAZ" },

  { name: "Ford", country: "USA", code: "FOR" },
  { name: "Volvo", country: "Sweden", code: "VOL" },

  { name: "Renault", country: "France", code: "REN" },
];

const TRANSMISSIONS = [
  { type: "MT5", gears: 5 },
  { type: "MT6", gears: 6 },
  { type: "AT6", gears: 6 },
  { type: "AT8", gears: 8 },
  { type: "AT10", gears: 10 },
  { type: "DCT6", gears: 6 },
  { type: "DCT7", gears: 7 },
  { type: "DCT8", gears: 8 },
  { type: "CVT", gears: 0 },
  { type: "eCVT", gears: 0 },
  { type: "PDK7", gears: 7 },
];

const DRIVETRAINS = [
  { type: "FWD", description: "Front-wheel drive" },
  { type: "RWD", description: "Rear-wheel drive" },
  { type: "AWD", description: "All-wheel drive" },
  { type: "4WD", description: "Selectable four-wheel drive" },

  { type: "AWD_quattro", description: "Audi quattro-style AWD" },
  { type: "AWD_xDrive", description: "BMW xDrive-style AWD" },
  { type: "AWD_4Matic", description: "Mercedes 4MATIC-style AWD" },
  { type: "AWD_Haldex", description: "On-demand AWD (Haldex-style)" },

  { type: "RWD_Performance", description: "Performance RWD" },
  { type: "AWD_Performance", description: "Performance AWD" },
];

type EngineSeed = {
  code: string;
  configuration: string | null;
  displacementCc: number | null;
  cylinders: number | null;
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  aspiration: "NA" | "Turbo" | null;
  powerPs: number;
  torqueNm: number;
};

function enginePayload(e: EngineSeed) {
  return {
    code: e.code,
    configuration: e.configuration,
    displacementLiters: e.displacementCc ? +(e.displacementCc / 1000).toFixed(3) : null,
    displacementCc: e.displacementCc,
    cylinders: e.cylinders,
    fuelType: e.fuelType,
    aspiration: e.aspiration,
    powerPs: e.powerPs,
    powerKw: Math.round(e.powerPs * 0.73549875),
    torqueNm: e.torqueNm,
    torqueLbft: Math.round(e.torqueNm * 0.737562149),
  };
}

/**
 * Curated engine pool (make-scoped codes).
 * These are “public-knowledge plausible” families; not market-perfect.
 */
const ENGINES: EngineSeed[] = [
  // VW
  { code: "VW_EA111_1.4_TSI", configuration: "I4", displacementCc: 1390, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 122, torqueNm: 200 },
  { code: "VW_EA211_1.5_TSI", configuration: "I4", displacementCc: 1498, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 150, torqueNm: 250 },
  { code: "VW_EA888_2.0_TSI", configuration: "I4", displacementCc: 1984, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 245, torqueNm: 370 },
  { code: "VW_EA288_2.0_TDI", configuration: "I4", displacementCc: 1968, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 150, torqueNm: 340 },
  { code: "VW_PHEV_1.4_TSI", configuration: "I4", displacementCc: 1395, cylinders: 4, fuelType: "Hybrid", aspiration: "Turbo", powerPs: 204, torqueNm: 350 },

  // Audi
  { code: "AUDI_1.4_TFSI", configuration: "I4", displacementCc: 1395, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 150, torqueNm: 250 },
  { code: "AUDI_2.0_TFSI", configuration: "I4", displacementCc: 1984, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 252, torqueNm: 370 },
  { code: "AUDI_2.0_TDI", configuration: "I4", displacementCc: 1968, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 190, torqueNm: 400 },
  { code: "AUDI_3.0_TFSI", configuration: "V6", displacementCc: 2995, cylinders: 6, fuelType: "Petrol", aspiration: "Turbo", powerPs: 340, torqueNm: 500 },

  // BMW
  { code: "BMW_N46_2.0", configuration: "I4", displacementCc: 1995, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 150, torqueNm: 200 },
  { code: "BMW_B48_2.0T", configuration: "I4", displacementCc: 1998, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 184, torqueNm: 300 },
  { code: "BMW_B58_3.0T", configuration: "I6", displacementCc: 2998, cylinders: 6, fuelType: "Petrol", aspiration: "Turbo", powerPs: 340, torqueNm: 500 },
  { code: "BMW_B47_2.0D", configuration: "I4", displacementCc: 1995, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 190, torqueNm: 400 },

  // Mercedes
  { code: "MB_M274_2.0T", configuration: "I4", displacementCc: 1991, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 184, torqueNm: 300 },
  { code: "MB_M256_3.0T", configuration: "I6", displacementCc: 2999, cylinders: 6, fuelType: "Petrol", aspiration: "Turbo", powerPs: 367, torqueNm: 500 },
  { code: "MB_OM651_2.1D", configuration: "I4", displacementCc: 2143, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 170, torqueNm: 400 },
  { code: "MB_OM654_2.0D", configuration: "I4", displacementCc: 1950, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 194, torqueNm: 400 },

  // Porsche
  { code: "POR_2.0T", configuration: "I4", displacementCc: 1988, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 300, torqueNm: 380 },
  { code: "POR_3.0TT", configuration: "V6", displacementCc: 2981, cylinders: 6, fuelType: "Petrol", aspiration: "Turbo", powerPs: 385, torqueNm: 450 },
  { code: "POR_4.0NA", configuration: "H6", displacementCc: 3996, cylinders: 6, fuelType: "Petrol", aspiration: "NA", powerPs: 510, torqueNm: 470 },

  // Toyota
  { code: "TOY_1.8", configuration: "I4", displacementCc: 1798, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 140, torqueNm: 175 },
  { code: "TOY_2.0", configuration: "I4", displacementCc: 1987, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 170, torqueNm: 203 },
  { code: "TOY_HYBRID_1.8", configuration: "I4", displacementCc: 1798, cylinders: 4, fuelType: "Hybrid", aspiration: "NA", powerPs: 122, torqueNm: 200 },
  { code: "TOY_HYBRID_2.5", configuration: "I4", displacementCc: 2487, cylinders: 4, fuelType: "Hybrid", aspiration: "NA", powerPs: 218, torqueNm: 300 },

  // Honda
  { code: "HON_R18_1.8", configuration: "I4", displacementCc: 1799, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 140, torqueNm: 174 },
  { code: "HON_L15_1.5T", configuration: "I4", displacementCc: 1498, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 182, torqueNm: 240 },
  { code: "HON_K20_2.0", configuration: "I4", displacementCc: 1998, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 155, torqueNm: 190 },
  { code: "HON_HYBRID_2.0", configuration: "I4", displacementCc: 1993, cylinders: 4, fuelType: "Hybrid", aspiration: "NA", powerPs: 184, torqueNm: 315 },

  // Mazda
  { code: "MAZ_MZR_2.0", configuration: "I4", displacementCc: 1999, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 160, torqueNm: 188 },
  { code: "MAZ_SKYACTIV_2.0G", configuration: "I4", displacementCc: 1998, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 165, torqueNm: 213 },
  { code: "MAZ_SKYACTIV_2.5G", configuration: "I4", displacementCc: 2488, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 190, torqueNm: 252 },
  { code: "MAZ_SKYACTIV_2.2D", configuration: "I4", displacementCc: 2191, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 175, torqueNm: 420 },

  // Ford
  { code: "FOR_DURATEC_1.6", configuration: "I4", displacementCc: 1596, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 120, torqueNm: 159 },
  { code: "FOR_1.0_ECOBOOST", configuration: "I3", displacementCc: 999, cylinders: 3, fuelType: "Petrol", aspiration: "Turbo", powerPs: 125, torqueNm: 200 },
  { code: "FOR_2.0_TDCI", configuration: "I4", displacementCc: 1997, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 163, torqueNm: 340 },
  { code: "FOR_2.3_ECOBOOST", configuration: "I4", displacementCc: 2261, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 290, torqueNm: 440 },
  { code: "FOR_DURATEC_1.4_16V", configuration: "I4", displacementCc: 1388, cylinders: 4, fuelType: "Petrol", aspiration: "NA", powerPs: 80, torqueNm: 124 },

  // Volvo
  { code: "VOL_D4_2.0D", configuration: "I4", displacementCc: 1969, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 190, torqueNm: 400 },
  { code: "VOL_T5_2.0T", configuration: "I4", displacementCc: 1969, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 250, torqueNm: 350 },
  { code: "VOL_T6_2.0T", configuration: "I4", displacementCc: 1969, cylinders: 4, fuelType: "Petrol", aspiration: "Turbo", powerPs: 310, torqueNm: 400 },
  { code: "VOL_RECHARGE_PHEV", configuration: "I4", displacementCc: 1969, cylinders: 4, fuelType: "Hybrid", aspiration: "Turbo", powerPs: 340, torqueNm: 590 },

  // Renault
  { code: "REN_K9K_1.5_DCI", configuration: "I4", displacementCc: 1461, cylinders: 4, fuelType: "Diesel", aspiration: "Turbo", powerPs: 90, torqueNm: 220 },
];

type ConfigSeed = {
  year: number;
  engineCode: string;
  fuelType: EngineSeed["fuelType"];
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
  phaseName: string;
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
  make: { name: string; country: string };
  model: { name: string };
  generations: GenerationSeed[];
};

/** helper to create phases for a gen */
function makePhases(start: number, end: number) {
  const mid = Math.min(start + Math.floor((end - start) / 2), end);
  return [
    { name: "Pre-facelift", startYear: start, endYear: mid },
    { name: "Facelift", startYear: Math.min(mid + 1, end), endYear: end },
  ];
}

/** build version configs deterministically per year with slight progression */
function yearConfigs(params: {
  years: number[];
  engineCode: string;
  fuelType: EngineSeed["fuelType"];
  transmissionType: string;
  drivetrainType: string;
  basePower: number;
  baseTorque: number;
  base0to100: number;
  stepPower?: number;
  stepTorque?: number;
  step0to100?: number;
}) {
  const {
    years,
    engineCode,
    fuelType,
    transmissionType,
    drivetrainType,
    basePower,
    baseTorque,
    base0to100,
    stepPower = 2,
    stepTorque = 5,
    step0to100 = -0.05,
  } = params;

  return years.map((y, idx) => ({
    year: y,
    engineCode,
    fuelType,
    transmissionType,
    drivetrainType,
    powerPs: basePower + idx * stepPower,
    torqueNm: baseTorque + idx * stepTorque,
    zeroTo100: round1(clamp(base0to100 + idx * step0to100, 3.0, 20.0)),
  }));
}

/**
 * Curated pack (~40 models). Each model has 1–3 gens, correct-ish body type + engines/trims.
 * This is the “hardcoded dataset”.
 */
const CATALOG: ModelSeedTree[] = [
  // ---------------- VW ----------------
  {
    make: { name: "Volkswagen", country: "Germany" },
    model: { name: "Golf" },
    generations: [
      {
        name: "Golf Mk6",
        startYear: 2008,
        endYear: 2012,
        phases: makePhases(2008, 2012),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2578,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.4 TSI",
                startYear: 2008,
                endYear: 2012,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012],
                  engineCode: "VW_EA111_1.4_TSI",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 122,
                  baseTorque: 200,
                  base0to100: 9.5,
                }),
              },
              {
                name: "2.0 TDI",
                startYear: 2009,
                endYear: 2012,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012],
                  engineCode: "VW_EA288_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 140,
                  baseTorque: 320,
                  base0to100: 9.2,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Golf Mk7",
        startYear: 2012,
        endYear: 2020,
        phases: makePhases(2012, 2020),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2637,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.5 TSI",
                startYear: 2017,
                endYear: 2020,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2017, 2018, 2019, 2020],
                  engineCode: "VW_EA211_1.5_TSI",
                  fuelType: "Petrol",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 150,
                  baseTorque: 250,
                  base0to100: 8.2,
                }),
              },
              {
                name: "GTI 2.0 TSI",
                startYear: 2013,
                endYear: 2020,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2016, 2017, 2018, 2019, 2020],
                  engineCode: "VW_EA888_2.0_TSI",
                  fuelType: "Petrol",
                  transmissionType: "DCT7",
                  drivetrainType: "FWD",
                  basePower: 220,
                  baseTorque: 350,
                  base0to100: 6.8,
                  stepPower: 3,
                  stepTorque: 8,
                  step0to100: -0.06,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Golf Mk8",
        startYear: 2020,
        endYear: 2025,
        phases: makePhases(2020, 2025),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2636,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.5 eTSI",
                startYear: 2020,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2020, 2021, 2022, 2023],
                  engineCode: "VW_EA211_1.5_TSI",
                  fuelType: "Petrol",
                  transmissionType: "DCT7",
                  drivetrainType: "FWD",
                  basePower: 150,
                  baseTorque: 250,
                  base0to100: 8.4,
                }),
              },
              {
                name: "GTE (PHEV)",
                startYear: 2020,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2020, 2021, 2022, 2023],
                  engineCode: "VW_PHEV_1.4_TSI",
                  fuelType: "Hybrid",
                  transmissionType: "DCT6",
                  drivetrainType: "FWD",
                  basePower: 204,
                  baseTorque: 350,
                  base0to100: 7.6,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    make: { name: "Volkswagen", country: "Germany" },
    model: { name: "Passat" },
    generations: [
      {
        name: "Passat B7",
        startYear: 2010,
        endYear: 2014,
        phases: makePhases(2010, 2014),
        bodyVariants: [
          {
            name: "Sedan 4D",
            doors: 4,
            wheelbaseMm: 2712,
            bodyTypeName: "Sedan",
            versions: [
              {
                name: "1.4 TSI",
                startYear: 2010,
                endYear: 2014,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2011, 2012, 2013, 2014],
                  engineCode: "VW_EA111_1.4_TSI",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 122,
                  baseTorque: 200,
                  base0to100: 10.2,
                }),
              },
              {
                name: "2.0 TDI",
                startYear: 2010,
                endYear: 2014,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2011, 2012, 2013, 2014],
                  engineCode: "VW_EA288_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 140,
                  baseTorque: 320,
                  base0to100: 9.6,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Passat B8",
        startYear: 2014,
        endYear: 2022,
        phases: makePhases(2014, 2022),
        bodyVariants: [
          {
            name: "Estate 5D",
            doors: 5,
            wheelbaseMm: 2786,
            bodyTypeName: "Estate",
            versions: [
              {
                name: "1.5 TSI",
                startYear: 2015,
                endYear: 2022,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2017, 2018, 2019, 2020, 2021, 2022],
                  engineCode: "VW_EA211_1.5_TSI",
                  fuelType: "Petrol",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 150,
                  baseTorque: 250,
                  base0to100: 9.0,
                }),
              },
              {
                name: "2.0 TDI",
                startYear: 2015,
                endYear: 2022,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2016, 2017, 2018, 2019, 2020, 2021],
                  engineCode: "VW_EA288_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 150,
                  baseTorque: 340,
                  base0to100: 8.8,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- Audi ----------------
  {
    make: { name: "Audi", country: "Germany" },
    model: { name: "A4" },
    generations: [
      {
        name: "A4 B8",
        startYear: 2008,
        endYear: 2015,
        phases: makePhases(2008, 2015),
        bodyVariants: [
          {
            name: "Sedan 4D",
            doors: 4,
            wheelbaseMm: 2808,
            bodyTypeName: "Sedan",
            versions: [
              {
                name: "2.0 TDI",
                startYear: 2008,
                endYear: 2015,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2011, 2012, 2013, 2014, 2015],
                  engineCode: "AUDI_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 170,
                  baseTorque: 350,
                  base0to100: 8.7,
                }),
              },
              {
                name: "2.0 TFSI quattro",
                startYear: 2009,
                endYear: 2015,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2011, 2012, 2013, 2014, 2015],
                  engineCode: "AUDI_2.0_TFSI",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_quattro",
                  basePower: 211,
                  baseTorque: 350,
                  base0to100: 6.6,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "A4 B9",
        startYear: 2015,
        endYear: 2024,
        phases: makePhases(2015, 2024),
        bodyVariants: [
          {
            name: "Estate 5D",
            doors: 5,
            wheelbaseMm: 2818,
            bodyTypeName: "Estate",
            versions: [
              {
                name: "2.0 TDI",
                startYear: 2016,
                endYear: 2024,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2017, 2018, 2019, 2020, 2021, 2022],
                  engineCode: "AUDI_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "AT8",
                  drivetrainType: "FWD",
                  basePower: 190,
                  baseTorque: 400,
                  base0to100: 7.8,
                }),
              },
              {
                name: "3.0 TFSI quattro",
                startYear: 2016,
                endYear: 2024,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2017, 2018, 2019, 2020],
                  engineCode: "AUDI_3.0_TFSI",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_quattro",
                  basePower: 340,
                  baseTorque: 500,
                  base0to100: 4.9,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    make: { name: "Audi", country: "Germany" },
    model: { name: "Q5" },
    generations: [
      {
        name: "Q5 8R",
        startYear: 2008,
        endYear: 2016,
        phases: makePhases(2008, 2016),
        bodyVariants: [
          {
            name: "SUV 5D",
            doors: 5,
            wheelbaseMm: 2807,
            bodyTypeName: "SUV",
            versions: [
              {
                name: "2.0 TDI quattro",
                startYear: 2009,
                endYear: 2016,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2012, 2013, 2014, 2015, 2016],
                  engineCode: "AUDI_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_quattro",
                  basePower: 177,
                  baseTorque: 380,
                  base0to100: 8.2,
                }),
              },
              {
                name: "2.0 TFSI quattro",
                startYear: 2009,
                endYear: 2016,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2012, 2013, 2014, 2015, 2016],
                  engineCode: "AUDI_2.0_TFSI",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_quattro",
                  basePower: 225,
                  baseTorque: 350,
                  base0to100: 7.0,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Q5 FY",
        startYear: 2016,
        endYear: 2024,
        phases: makePhases(2016, 2024),
        bodyVariants: [
          {
            name: "SUV 5D",
            doors: 5,
            wheelbaseMm: 2819,
            bodyTypeName: "SUV",
            versions: [
              {
                name: "2.0 TDI quattro",
                startYear: 2017,
                endYear: 2024,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2018, 2019, 2020, 2021, 2022],
                  engineCode: "AUDI_2.0_TDI",
                  fuelType: "Diesel",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_quattro",
                  basePower: 190,
                  baseTorque: 400,
                  base0to100: 7.9,
                }),
              },
              {
                name: "2.0 TFSI quattro",
                startYear: 2017,
                endYear: 2024,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2018, 2019, 2020, 2021, 2022],
                  engineCode: "AUDI_2.0_TFSI",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_quattro",
                  basePower: 252,
                  baseTorque: 370,
                  base0to100: 6.3,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- BMW ----------------
  {
    make: { name: "BMW", country: "Germany" },
    model: { name: "3 Series" },
    generations: [
      {
        name: "3 Series E90/E91",
        startYear: 2005,
        endYear: 2011,
        phases: makePhases(2005, 2011),
        bodyVariants: [
          {
            name: "Sedan 4D",
            doors: 4,
            wheelbaseMm: 2760,
            bodyTypeName: "Sedan",
            versions: [
              {
                name: "320i",
                startYear: 2005,
                endYear: 2011,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2007, 2008, 2009, 2010, 2011],
                  engineCode: "BMW_N46_2.0",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "RWD",
                  basePower: 150,
                  baseTorque: 200,
                  base0to100: 9.0,
                }),
              },
              {
                name: "320d",
                startYear: 2005,
                endYear: 2011,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2007, 2008, 2009, 2010, 2011],
                  engineCode: "BMW_B47_2.0D",
                  fuelType: "Diesel",
                  transmissionType: "AT6",
                  drivetrainType: "RWD",
                  basePower: 177,
                  baseTorque: 350,
                  base0to100: 8.0,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "3 Series F30/F31",
        startYear: 2012,
        endYear: 2018,
        phases: makePhases(2012, 2018),
        bodyVariants: [
          {
            name: "Estate 5D",
            doors: 5,
            wheelbaseMm: 2810,
            bodyTypeName: "Estate",
            versions: [
              {
                name: "320i",
                startYear: 2012,
                endYear: 2018,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2014, 2015, 2016, 2017, 2018],
                  engineCode: "BMW_B48_2.0T",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "RWD",
                  basePower: 184,
                  baseTorque: 290,
                  base0to100: 7.4,
                }),
              },
              {
                name: "330i xDrive",
                startYear: 2016,
                endYear: 2018,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2016, 2017, 2018],
                  engineCode: "BMW_B48_2.0T",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_xDrive",
                  basePower: 252,
                  baseTorque: 350,
                  base0to100: 5.9,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "3 Series G20/G21",
        startYear: 2019,
        endYear: 2025,
        phases: makePhases(2019, 2025),
        bodyVariants: [
          {
            name: "Sedan 4D",
            doors: 4,
            wheelbaseMm: 2851,
            bodyTypeName: "Sedan",
            versions: [
              {
                name: "330i",
                startYear: 2019,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2019, 2020, 2021, 2022, 2023],
                  engineCode: "BMW_B48_2.0T",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "RWD",
                  basePower: 258,
                  baseTorque: 400,
                  base0to100: 5.8,
                }),
              },
              {
                name: "M340i xDrive",
                startYear: 2019,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2019, 2020, 2021, 2022, 2023],
                  engineCode: "BMW_B58_3.0T",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD_xDrive",
                  basePower: 374,
                  baseTorque: 500,
                  base0to100: 4.6,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- Mazda ----------------
  {
    make: { name: "Mazda", country: "Japan" },
    model: { name: "MX-5" },
    generations: [
      {
        name: "MX-5 NC",
        startYear: 2005,
        endYear: 2015,
        phases: makePhases(2005, 2015),
        bodyVariants: [
          {
            name: "Roadster 2D",
            doors: 2,
            wheelbaseMm: 2330,
            bodyTypeName: "Convertible",
            versions: [
              {
                name: "2.0 MZR",
                startYear: 2006,
                endYear: 2015,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012, 2013],
                  engineCode: "MAZ_MZR_2.0",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "RWD",
                  basePower: 160,
                  baseTorque: 188,
                  base0to100: 7.9,
                }),
              },
              {
                name: "2.0 Auto",
                startYear: 2009,
                endYear: 2015,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012, 2013],
                  engineCode: "MAZ_MZR_2.0",
                  fuelType: "Petrol",
                  transmissionType: "AT6",
                  drivetrainType: "RWD",
                  basePower: 160,
                  baseTorque: 188,
                  base0to100: 8.6,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "MX-5 ND",
        startYear: 2015,
        endYear: 2025,
        phases: makePhases(2015, 2025),
        bodyVariants: [
          {
            name: "Roadster 2D",
            doors: 2,
            wheelbaseMm: 2310,
            bodyTypeName: "Convertible",
            versions: [
              {
                name: "2.0 Skyactiv-G",
                startYear: 2016,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2016, 2017, 2018, 2019, 2020, 2021],
                  engineCode: "MAZ_SKYACTIV_2.0G",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "RWD",
                  basePower: 160,
                  baseTorque: 200,
                  base0to100: 7.3,
                }),
              },
              {
                name: "2.0 Skyactiv-G Auto",
                startYear: 2016,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2016, 2017, 2018, 2019, 2020, 2021],
                  engineCode: "MAZ_SKYACTIV_2.0G",
                  fuelType: "Petrol",
                  transmissionType: "AT6",
                  drivetrainType: "RWD",
                  basePower: 160,
                  baseTorque: 200,
                  base0to100: 7.9,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    make: { name: "Mazda", country: "Japan" },
    model: { name: "Mazda3" },
    generations: [
      {
        name: "Mazda3 BM/BN",
        startYear: 2013,
        endYear: 2019,
        phases: makePhases(2013, 2019),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2700,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "2.0 Skyactiv-G",
                startYear: 2014,
                endYear: 2019,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2014, 2015, 2016, 2017, 2018, 2019],
                  engineCode: "MAZ_SKYACTIV_2.0G",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 120,
                  baseTorque: 210,
                  base0to100: 8.8,
                }),
              },
              {
                name: "2.2 Skyactiv-D",
                startYear: 2014,
                endYear: 2019,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2014, 2015, 2016, 2017, 2018],
                  engineCode: "MAZ_SKYACTIV_2.2D",
                  fuelType: "Diesel",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 150,
                  baseTorque: 380,
                  base0to100: 8.2,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Mazda3 BP",
        startYear: 2019,
        endYear: 2025,
        phases: makePhases(2019, 2025),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2725,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "2.0 Skyactiv-G",
                startYear: 2019,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2019, 2020, 2021, 2022, 2023],
                  engineCode: "MAZ_SKYACTIV_2.0G",
                  fuelType: "Petrol",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 150,
                  baseTorque: 213,
                  base0to100: 8.5,
                }),
              },
              {
                name: "2.5 Skyactiv-G AWD",
                startYear: 2020,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2020, 2021, 2022, 2023],
                  engineCode: "MAZ_SKYACTIV_2.5G",
                  fuelType: "Petrol",
                  transmissionType: "AT6",
                  drivetrainType: "AWD",
                  basePower: 186,
                  baseTorque: 252,
                  base0to100: 7.4,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- Toyota ----------------
  {
    make: { name: "Toyota", country: "Japan" },
    model: { name: "Corolla" },
    generations: [
      {
        name: "Corolla E140/E150",
        startYear: 2006,
        endYear: 2013,
        phases: makePhases(2006, 2013),
        bodyVariants: [
          {
            name: "Sedan 4D",
            doors: 4,
            wheelbaseMm: 2600,
            bodyTypeName: "Sedan",
            versions: [
              {
                name: "1.8 VVT-i",
                startYear: 2007,
                endYear: 2013,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012, 2013],
                  engineCode: "TOY_1.8",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 132,
                  baseTorque: 174,
                  base0to100: 10.0,
                }),
              },
              {
                name: "1.8 CVT",
                startYear: 2009,
                endYear: 2013,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012, 2013],
                  engineCode: "TOY_1.8",
                  fuelType: "Petrol",
                  transmissionType: "CVT",
                  drivetrainType: "FWD",
                  basePower: 132,
                  baseTorque: 174,
                  base0to100: 10.5,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Corolla E210",
        startYear: 2018,
        endYear: 2025,
        phases: makePhases(2018, 2025),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2640,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "2.0",
                startYear: 2019,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2019, 2020, 2021, 2022, 2023],
                  engineCode: "TOY_2.0",
                  fuelType: "Petrol",
                  transmissionType: "CVT",
                  drivetrainType: "FWD",
                  basePower: 170,
                  baseTorque: 203,
                  base0to100: 8.1,
                }),
              },
              {
                name: "Hybrid 1.8",
                startYear: 2019,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2019, 2020, 2021, 2022, 2023],
                  engineCode: "TOY_HYBRID_1.8",
                  fuelType: "Hybrid",
                  transmissionType: "eCVT",
                  drivetrainType: "FWD",
                  basePower: 122,
                  baseTorque: 200,
                  base0to100: 10.9,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- Honda ----------------
  {
    make: { name: "Honda", country: "Japan" },
    model: { name: "Civic" },
    generations: [
      {
        name: "Civic 8th Gen",
        startYear: 2005,
        endYear: 2011,
        phases: makePhases(2005, 2011),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2635,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.8 i-VTEC",
                startYear: 2006,
                endYear: 2011,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2007, 2008, 2009, 2010, 2011],
                  engineCode: "HON_R18_1.8",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 140,
                  baseTorque: 174,
                  base0to100: 9.0,
                }),
              },
              {
                name: "2.0 (NA)",
                startYear: 2006,
                endYear: 2011,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2007, 2008, 2009, 2010],
                  engineCode: "HON_K20_2.0",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 155,
                  baseTorque: 190,
                  base0to100: 8.6,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "Civic 10th Gen",
        startYear: 2015,
        endYear: 2021,
        phases: makePhases(2015, 2021),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2697,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.5 Turbo",
                startYear: 2017,
                endYear: 2021,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2017, 2018, 2019, 2020, 2021],
                  engineCode: "HON_L15_1.5T",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 182,
                  baseTorque: 240,
                  base0to100: 8.2,
                }),
              },
              {
                name: "Hybrid 2.0",
                startYear: 2020,
                endYear: 2021,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2020, 2021],
                  engineCode: "HON_HYBRID_2.0",
                  fuelType: "Hybrid",
                  transmissionType: "eCVT",
                  drivetrainType: "FWD",
                  basePower: 184,
                  baseTorque: 315,
                  base0to100: 7.9,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- Ford ----------------
  {
    make: { name: "Ford", country: "USA" },
    model: { name: "Focus" },
    generations: [
      {
        name: "Focus Mk2",
        startYear: 2004,
        endYear: 2011,
        phases: makePhases(2004, 2011),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2640,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.6 Duratec",
                startYear: 2005,
                endYear: 2011,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2007, 2008, 2009, 2010, 2011],
                  engineCode: "FOR_DURATEC_1.6",
                  fuelType: "Petrol",
                  transmissionType: "MT5",
                  drivetrainType: "FWD",
                  basePower: 115,
                  baseTorque: 159,
                  base0to100: 10.5,
                }),
              },
              {
                name: "2.0 TDCi",
                startYear: 2007,
                endYear: 2011,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2008, 2009, 2010, 2011],
                  engineCode: "FOR_2.0_TDCI",
                  fuelType: "Diesel",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 136,
                  baseTorque: 320,
                  base0to100: 9.2,
                }),
              },
            ],
          },

          // ✅ NEW ADDITION — Focus Mk2 Estate / Wagon
          {
            name: "Estate (Wagon) 5D",
            doors: 5,
            wheelbaseMm: 2640,
            bodyTypeName: "Estate",
            versions: [
              {
                name: "1.4 Duratec 16V",
                startYear: 2005,
                endYear: 2011,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2005, 2006, 2007, 2008, 2009, 2010, 2011],
                  engineCode: "FOR_DURATEC_1.4_16V",
                  fuelType: "Petrol",
                  transmissionType: "MT5",
                  drivetrainType: "FWD",
                  basePower: 80,
                  baseTorque: 124,
                  base0to100: 14.2,
                  stepPower: 0,
                  stepTorque: 0,
                  step0to100: 0,
                }),
              },
            ],
          },
        ],
      },

      {
        name: "Focus Mk3",
        startYear: 2011,
        endYear: 2018,
        phases: makePhases(2011, 2018),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2648,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.0 EcoBoost",
                startYear: 2012,
                endYear: 2018,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2012, 2013, 2014, 2015, 2016],
                  engineCode: "FOR_1.0_ECOBOOST",
                  fuelType: "Petrol",
                  transmissionType: "MT6",
                  drivetrainType: "FWD",
                  basePower: 125,
                  baseTorque: 200,
                  base0to100: 11.0,
                }),
              },
              {
                name: "2.0 TDCi",
                startYear: 2012,
                endYear: 2018,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2012, 2013, 2014, 2015, 2016],
                  engineCode: "FOR_2.0_TDCI",
                  fuelType: "Diesel",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 163,
                  baseTorque: 340,
                  base0to100: 8.8,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- Volvo ----------------
  {
    make: { name: "Volvo", country: "Sweden" },
    model: { name: "XC60" },
    generations: [
      {
        name: "XC60 I",
        startYear: 2008,
        endYear: 2017,
        phases: makePhases(2008, 2017),
        bodyVariants: [
          {
            name: "SUV 5D",
            doors: 5,
            wheelbaseMm: 2774,
            bodyTypeName: "SUV",
            versions: [
              {
                name: "D4",
                startYear: 2014,
                endYear: 2017,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2014, 2015, 2016, 2017],
                  engineCode: "VOL_D4_2.0D",
                  fuelType: "Diesel",
                  transmissionType: "AT8",
                  drivetrainType: "FWD",
                  basePower: 190,
                  baseTorque: 400,
                  base0to100: 8.1,
                }),
              },
              {
                name: "T5 AWD",
                startYear: 2014,
                endYear: 2017,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2014, 2015, 2016, 2017],
                  engineCode: "VOL_T5_2.0T",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD",
                  basePower: 245,
                  baseTorque: 350,
                  base0to100: 7.2,
                }),
              },
            ],
          },
        ],
      },
      {
        name: "XC60 II",
        startYear: 2017,
        endYear: 2025,
        phases: makePhases(2017, 2025),
        bodyVariants: [
          {
            name: "SUV 5D",
            doors: 5,
            wheelbaseMm: 2865,
            bodyTypeName: "SUV",
            versions: [
              {
                name: "T6 AWD",
                startYear: 2018,
                endYear: 2025,
                phaseName: "Pre-facelift",
                configs: yearConfigs({
                  years: [2018, 2019, 2020, 2021, 2022],
                  engineCode: "VOL_T6_2.0T",
                  fuelType: "Petrol",
                  transmissionType: "AT8",
                  drivetrainType: "AWD",
                  basePower: 310,
                  baseTorque: 400,
                  base0to100: 5.8,
                }),
              },
              {
                name: "Recharge (PHEV)",
                startYear: 2020,
                endYear: 2025,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2020, 2021, 2022, 2023],
                  engineCode: "VOL_RECHARGE_PHEV",
                  fuelType: "Hybrid",
                  transmissionType: "AT8",
                  drivetrainType: "AWD",
                  basePower: 340,
                  baseTorque: 590,
                  base0to100: 5.3,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  // ---------------- Renault ----------------
  {
    make: { name: "Renault", country: "France" },
    model: { name: "Clio" },
    generations: [
      {
        name: "Clio III (X85)",
        startYear: 2005,
        endYear: 2014,
        phases: makePhases(2005, 2014),
        bodyVariants: [
          {
            name: "Hatchback 5D",
            doors: 5,
            wheelbaseMm: 2575,
            bodyTypeName: "Hatchback",
            versions: [
              {
                name: "1.5 dCi",
                startYear: 2006,
                endYear: 2014,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014],
                  engineCode: "REN_K9K_1.5_DCI",
                  fuelType: "Diesel",
                  transmissionType: "MT5",
                  drivetrainType: "FWD",
                  basePower: 85,
                  baseTorque: 200,
                  base0to100: 11.5,
                  stepPower: 1,     // slight evolution
                  stepTorque: 4,
                  step0to100: -0.03,
                }),
              },
              {
                name: "1.5 dCi (Auto)",
                startYear: 2009,
                endYear: 2014,
                phaseName: "Facelift",
                configs: yearConfigs({
                  years: [2009, 2010, 2011, 2012, 2013, 2014],
                  engineCode: "REN_K9K_1.5_DCI",
                  fuelType: "Diesel",
                  transmissionType: "AT6",
                  drivetrainType: "FWD",
                  basePower: 85,
                  baseTorque: 200,
                  base0to100: 12.2,
                  stepPower: 1,
                  stepTorque: 4,
                  step0to100: -0.03,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
];

// -------------------- Upsert utilities --------------------

async function seedEngines() {
  // chunk to avoid huge payloads
  const payloads = ENGINES.map(enginePayload);
  const chunkSize = 40;

  for (let i = 0; i < payloads.length; i += chunkSize) {
    const chunk = payloads.slice(i, i + chunkSize);
    await tryPost(endpoints.enginesCreate, chunk, undefined, `Seed engines ${i + 1}-${i + chunk.length}`);
  }
}

async function main() {
  console.log("Seeding via API:", { BASE_URL, API_PREFIX });

  const token = await ensureAuth();

  // 1) makes (protected)
  await tryPost(
    endpoints.makesCreate,
    MAKES.map((m) => ({ name: m.name, country: m.country })),
    token,
    `Seed makes (${MAKES.length})`
  );

  // 2) transmissions + drivetrains (public, safe)
  await ensureTransmissions(TRANSMISSIONS);
  await ensureDrivetrains(DRIVETRAINS);

  // 3) engines (public)
  await seedEngines();

  // 4) rebuild maps (reuse IDs)
  const txByType = await buildTransmissionMap();
  const dtByType = await buildDrivetrainMap();

  // Ensure required tx/dt types exist (defensive)
  const requiredTx = uniq(
    CATALOG.flatMap((t) =>
      t.generations.flatMap((g) =>
        g.bodyVariants.flatMap((bv) => bv.versions.flatMap((v) => v.configs.map((c) => c.transmissionType)))
      )
    )
  );
  const requiredDt = uniq(
    CATALOG.flatMap((t) =>
      t.generations.flatMap((g) =>
        g.bodyVariants.flatMap((bv) => bv.versions.flatMap((v) => v.configs.map((c) => c.drivetrainType)))
      )
    )
  );

  for (const t of requiredTx) {
    if (!txByType.get(t)) {
      console.warn(`⚠️ Missing transmission type in DB: ${t} (did not find id)`);
    }
  }
  for (const d of requiredDt) {
    if (!dtByType.get(d)) {
      console.warn(`⚠️ Missing drivetrain type in DB: ${d} (did not find id)`);
    }
  }

  // 5) upsert catalog trees
  let ok = 0;
  let fail = 0;

  for (const tree of CATALOG) {
    // Convert ConfigSeed into your API shape (reuse IDs)
    const fullTree: any = {
      make: tree.make,
      model: tree.model,
      generations: tree.generations.map((gen) => ({
        name: gen.name,
        startYear: gen.startYear,
        endYear: gen.endYear,
        phases: gen.phases,
        bodyVariants: gen.bodyVariants.map((bv) => ({
          name: bv.name,
          doors: bv.doors,
          wheelbaseMm: bv.wheelbaseMm,
          bodyType: { name: bv.bodyTypeName },
          versions: bv.versions.map((ver) => ({
            name: ver.name,
            startYear: ver.startYear,
            endYear: ver.endYear,
            phaseName: ver.phaseName,
            configs: ver.configs.map((c) => {
              const txId = txByType.get(c.transmissionType);
              const dtId = dtByType.get(c.drivetrainType);
              if (!txId) throw new Error(`Missing transmission id for type=${c.transmissionType}`);
              if (!dtId) throw new Error(`Missing drivetrain id for type=${c.drivetrainType}`);

              return {
                year: c.year,
                engine: { code: c.engineCode },
                transmission: { id: txId },
                drivetrain: { id: dtId },
                spec: {
                  fuelType: c.fuelType,
                  powerPsOverride: c.powerPs,
                  torqueNmOverride: c.torqueNm,
                  zeroTo100: c.zeroTo100,
                },
              };
            }),
          })),
        })),
      })),
    };

    try {
      await http("POST", endpoints.upsertFullModel, fullTree);
      ok++;
      console.log(`✅ upserted: ${tree.make.name} ${tree.model.name} (${ok}/${CATALOG.length})`);
    } catch (e: any) {
      fail++;
      console.warn(`❌ upsert failed: ${tree.make.name} ${tree.model.name}`);
      console.warn(String(e?.message ?? e));
    }
  }

  console.log("🎉 Seed complete", {
    makesSeeded: MAKES.length,
    modelsUpserted: ok,
    failed: fail,
    note: "Curated pack (deterministic). Add more models/gens by extending CATALOG.",
  });
}

main().catch((e) => {
  console.error("❌ Seed failed\n", e);
  process.exit(1);
});