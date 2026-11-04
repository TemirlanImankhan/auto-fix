interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
}

interface WebSerialApi {
  requestPort(): Promise<SerialPortLike>;
}

export function decodeElm327DtcResponse(response: string): string[] {
  const normalized = response.toUpperCase().replace(/[\s\r\n>]/g, "");
  if (normalized.includes("UNABLETOCONNECT") || normalized.includes("CANERROR") || normalized.includes("BUSERROR")) {
    throw new Error("ЭБУ не ответил на запрос. Проверьте зажигание, разъём OBD-II и совместимость адаптера.");
  }
  if (normalized.includes("NODATA")) return [];

  const start = normalized.indexOf("43");
  if (start < 0) {
    throw new Error("Адаптер не вернул ответ OBD-II. Проверьте подключение и повторите сканирование.");
  }

  const payload = normalized.slice(start + 2);
  if (payload.length % 4 !== 0 || !/^[0-9A-F]*$/.test(payload)) {
    throw new Error("Получен неполный ответ адаптера. Проверьте соединение и повторите сканирование.");
  }

  const systems = ["P", "C", "B", "U"] as const;
  const codes: string[] = [];
  for (let index = 0; index < payload.length; index += 4) {
    const first = Number.parseInt(payload.slice(index, index + 2), 16);
    const second = Number.parseInt(payload.slice(index + 2, index + 4), 16);
    if (first === 0 && second === 0) continue;

    const code = `${systems[first >> 6]}${(first >> 4) & 0x03}${(first & 0x0f).toString(16)}${second.toString(16).padStart(2, "0")}`.toUpperCase();
    if (!codes.includes(code)) codes.push(code);
  }

  if (codes.length > 10) {
    throw new Error("Найдено больше 10 кодов. Для полного отчёта используйте профессиональный сканер.");
  }
  return codes;
}

async function readElmResponse(reader: ReadableStreamDefaultReader<Uint8Array>, timeoutMs = 12_000): Promise<string> {
  const decoder = new TextDecoder();
  let response = "";
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Адаптер не ответил вовремя. Проверьте зажигание и USB-подключение.")), timeoutMs);
  });

  try {
    while (!response.includes(">")) {
      const { value, done } = await Promise.race([reader.read(), timedOut]);
      if (done) throw new Error("USB-соединение с адаптером прервано.");
      response += decoder.decode(value, { stream: true });
    }
    return response;
  } catch (cause) {
    await reader.cancel();
    throw cause;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function scanElm327(): Promise<string[]> {
  if (typeof navigator === "undefined") {
    throw new Error("Подключение по USB доступно только в браузере или приложении AutoFix для Windows.");
  }
  const serial = (navigator as Navigator & { serial?: WebSerialApi }).serial;
  if (!serial) {
    throw new Error("USB-сканирование доступно в приложении AutoFix для Windows или в Chrome/Edge.");
  }

  const port = await serial.requestPort();
  let opened = false;
  try {
    await port.open({ baudRate: 38400 });
    opened = true;
    const readable = port.readable;
    const writable = port.writable;
    if (!readable || !writable) throw new Error("Адаптер не открыл USB-канал. Отключите и подключите его снова.");

    const reader = readable.getReader();
    const writer = writable.getWriter();
    try {
      const send = async (command: string, timeoutMs?: number) => {
        await writer.write(new TextEncoder().encode(`${command}\r`));
        const response = await readElmResponse(reader, timeoutMs);
        if (response.includes("?")) throw new Error(`Адаптер не поддержал команду ${command}.`);
        return response;
      };

      await send("ATZ", 6_000);
      await send("ATE0");
      await send("ATL0");
      await send("ATS0");
      await send("ATH0");
      await send("ATSP0");
      const protocol = await send("0100");
      if (!protocol.replace(/\s/g, "").includes("4100")) {
        throw new Error("Не удалось связаться с ЭБУ. Включите зажигание и проверьте совместимость автомобиля с OBD-II.");
      }
      const faults = await send("03");
      return decodeElm327DtcResponse(faults);
    } finally {
      reader.releaseLock();
      writer.releaseLock();
    }
  } finally {
    if (opened) await port.close();
  }
}
