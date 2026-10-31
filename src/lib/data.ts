import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { diagnose, type DiagnosisResult } from "@/lib/ml/engine";
import { ENGINE_TYPES, type DiagnosisInput, type EngineType } from "@/lib/ml/taxonomy";

export type StoredCar = {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  engineType: EngineType;
};

export type StoredDiagnosis = {
  id: number;
  createdAt: string;
  carId: number | null;
  carLabel: string;
  input: DiagnosisInput;
  result: DiagnosisResult;
};

export const MAINTENANCE_TYPES = [
  { id: "oil", label: "Замена масла" },
  { id: "filters", label: "Фильтры" },
  { id: "brakes", label: "Тормоза" },
  { id: "tires", label: "Шины" },
  { id: "coolant", label: "Охлаждающая жидкость" },
  { id: "inspection", label: "Осмотр / ТО" },
  { id: "other", label: "Другое" },
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]["id"];

export type MaintenanceRecord = {
  id: number;
  carId: number;
  carLabel: string;
  currentMileage: number;
  serviceType: MaintenanceType;
  serviceDate: string;
  mileage: number;
  notes: string;
  nextServiceDate: string | null;
  nextServiceMileage: number | null;
};

const carInput = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().min(0).max(2_000_000),
  engineType: z.enum(ENGINE_TYPES.map((item) => item.id) as [EngineType, ...EngineType[]]),
});

const diagnosisInput = carInput.extend({
  startingProblem: z.boolean(),
  vibration: z.boolean(),
  noise: z.boolean(),
  overheating: z.boolean(),
  checkEngine: z.boolean(),
  brakeProblem: z.boolean(),
  fuelHigh: z.boolean(),
});

const carIdInput = z.number().int().positive();
const validIsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Укажите корректную дату");

export const listMaintenance = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<MaintenanceRecord>`
      select m.id, m.car_id as "carId", c.brand || ' ' || c.model || ' ' || c.year::text as "carLabel",
        c.mileage as "currentMileage", m.service_type as "serviceType", m.service_date::text as "serviceDate",
        m.mileage, m.notes, m.next_service_date::text as "nextServiceDate", m.next_service_mileage as "nextServiceMileage"
      from maintenance_records m
      join cars c on c.id = m.car_id and c.user_id = m.user_id
      where m.user_id = ${context.userId}
      order by m.service_date desc, m.id desc
    `;
  });

export const saveMaintenance = createServerFn({ method: "POST" })
  .validator((input: {
    id?: number; carId: number; serviceType: MaintenanceType; serviceDate: string; mileage: number;
    notes: string; nextServiceDate: string | null; nextServiceMileage: number | null;
  }) => {
    const data = {
      id: input.id === undefined ? undefined : carIdInput.parse(input.id),
      carId: carIdInput.parse(input.carId),
      serviceType: z.enum(MAINTENANCE_TYPES.map((item) => item.id) as [MaintenanceType, ...MaintenanceType[]]).parse(input.serviceType),
      serviceDate: validIsoDate.parse(input.serviceDate),
      mileage: z.number().int().min(0).max(2_000_000).parse(input.mileage),
      notes: z.string().trim().max(1000).parse(input.notes),
      nextServiceDate: input.nextServiceDate === null ? null : validIsoDate.parse(input.nextServiceDate),
      nextServiceMileage: input.nextServiceMileage === null ? null : z.number().int().min(0).max(2_000_000).parse(input.nextServiceMileage),
    };
    if (data.nextServiceMileage !== null && data.nextServiceMileage < data.mileage) {
      throw new Error("Плановый пробег не может быть меньше пробега на момент обслуживания");
    }
    if (data.nextServiceDate !== null && data.nextServiceDate < data.serviceDate) {
      throw new Error("Дата следующего обслуживания не может быть раньше даты работ");
    }
    return data;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const ownedCar = await sql<{ id: number }>`select id from cars where id = ${data.carId} and user_id = ${context.userId} limit 1`;
    if (!ownedCar[0]) throw new Error("Автомобиль не найден в вашем гараже");
    await sql`update cars set mileage = greatest(mileage, ${data.mileage}), updated_at = now() where id = ${data.carId} and user_id = ${context.userId}`;
    if (data.id !== undefined) {
      const rows = await sql<{ id: number }>`
        update maintenance_records set car_id = ${data.carId}, service_type = ${data.serviceType},
          service_date = ${data.serviceDate}, mileage = ${data.mileage}, notes = ${data.notes},
          next_service_date = ${data.nextServiceDate}, next_service_mileage = ${data.nextServiceMileage}
        where id = ${data.id} and user_id = ${context.userId} returning id
      `;
      if (!rows[0]) throw new Error("Запись обслуживания не найдена");
      return rows[0].id;
    }
    const rows = await sql<{ id: number }>`
      insert into maintenance_records (user_id, car_id, service_type, service_date, mileage, notes, next_service_date, next_service_mileage)
      values (${context.userId}, ${data.carId}, ${data.serviceType}, ${data.serviceDate}, ${data.mileage}, ${data.notes}, ${data.nextServiceDate}, ${data.nextServiceMileage})
      returning id
    `;
    return rows[0].id;
  });

export const removeMaintenance = createServerFn({ method: "POST" })
  .validator((id: number) => carIdInput.parse(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from maintenance_records where id = ${id} and user_id = ${context.userId}`;
  });

export const listCars = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<StoredCar>`
      select id, brand, model, year, mileage, engine_type as "engineType"
      from cars where user_id = ${context.userId} order by created_at desc, id desc
    `;
  });

export const saveCar = createServerFn({ method: "POST" })
  .validator((input: { id?: number; brand: string; model: string; year: number; mileage: number; engineType: EngineType }) => ({
    id: input.id === undefined ? undefined : carIdInput.parse(input.id),
    ...carInput.parse(input),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id !== undefined) {
      const rows = await sql<{ id: number }>`
        update cars set brand = ${data.brand}, model = ${data.model}, year = ${data.year},
          mileage = ${data.mileage}, engine_type = ${data.engineType}, updated_at = now()
        where id = ${data.id} and user_id = ${context.userId} returning id
      `;
      if (!rows[0]) throw new Error("Автомобиль не найден");
      return rows[0].id;
    }
    const rows = await sql<{ id: number }>`
      insert into cars (user_id, brand, model, year, mileage, engine_type)
      values (${context.userId}, ${data.brand}, ${data.model}, ${data.year}, ${data.mileage}, ${data.engineType})
      returning id
    `;
    return rows[0].id;
  });

export const removeCar = createServerFn({ method: "POST" })
  .validator((id: number) => carIdInput.parse(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from cars where id = ${id} and user_id = ${context.userId}`;
  });

export const listDiagnoses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<StoredDiagnosis>`
      select id, created_at::text as "createdAt", car_id as "carId", car_label as "carLabel", input, result
      from diagnoses where user_id = ${context.userId} order by created_at desc, id desc
    `;
  });

export const getDiagnosis = createServerFn({ method: "GET" })
  .validator((id: number) => carIdInput.parse(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<StoredDiagnosis>`
      select id, created_at::text as "createdAt", car_id as "carId", car_label as "carLabel", input, result
      from diagnoses where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ?? null;
  });

export const removeDiagnosis = createServerFn({ method: "POST" })
  .validator((id: number) => carIdInput.parse(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from diagnoses where id = ${id} and user_id = ${context.userId}`;
  });

export const createDiagnosis = createServerFn({ method: "POST" })
  .validator((input: { carId: number | null; input: DiagnosisInput }) => ({
    carId: input.carId === null ? null : carIdInput.parse(input.carId),
    input: diagnosisInput.parse(input.input) as DiagnosisInput,
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    let carLabel = `${data.input.brand} ${data.input.model} ${data.input.year}`;
    if (data.carId !== null) {
      const cars = await sql<{ id: number; brand: string; model: string; year: number }>`
        select id, brand, model, year from cars where id = ${data.carId} and user_id = ${context.userId} limit 1
      `;
      const car = cars[0];
      if (!car) throw new Error("Автомобиль не найден в вашем гараже");
      carLabel = `${car.brand} ${car.model} ${car.year}`;
    }
    const result = diagnose(data.input);
    const rows = await sql<{ id: number; createdAt: string }>`
      insert into diagnoses (user_id, car_id, car_label, input, result)
      values (${context.userId}, ${data.carId}, ${carLabel}, ${JSON.stringify(data.input)}::jsonb, ${JSON.stringify(result)}::jsonb)
      returning id, created_at::text as "createdAt"
    `;
    return { ...rows[0], carId: data.carId, carLabel, input: data.input, result } satisfies StoredDiagnosis;
  });
