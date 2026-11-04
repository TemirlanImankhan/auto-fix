import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, LocateFixed, MapPinned, Navigation, Phone, Search } from "lucide-react";
import { useRef, useState } from "react";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({ component: ServicesPage });

type Issue = "general" | "engine" | "electrics" | "brakes" | "cooling" | "tires";
type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  specialization?: string;
};
type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const COPY = {
  ru: {
    eyebrow: "AutoFix · поиск рядом", title: "Подобрать автосервис", intro: "Найдите ближайшие мастерские по типу неисправности и откройте маршрут.", type: "Что нужно проверить?", radius: "Радиус поиска", location: "Моё местоположение", nearby: "Найти рядом со мной", coordinates: "Или укажите координаты", lat: "Широта", lon: "Долгота", search: "Искать по координатам", loading: "Ищем сервисы…", results: "Сервисы поблизости", empty: "В этой области на карте пока не отмечены автосервисы. Попробуйте увеличить радиус.", useLocation: "Разрешите доступ к геолокации или укажите координаты вручную.", locateError: "Не удалось получить местоположение. Разрешите геолокацию или введите координаты.", invalid: "Проверьте широту и долготу: широта от −90 до 90, долгота от −180 до 180.", searchError: "Не удалось загрузить места. Попробуйте ещё раз чуть позже.", rateLimited: "Сервис карты временно ограничил запросы. Подождите немного и повторите.", mapTitle: "Карта OpenStreetMap с результатами рядом с выбранной точкой", openMap: "Карта", route: "Маршрут", noName: "Автосервис", general: "Диагностика / общий ремонт", engine: "Двигатель", electrics: "Автоэлектрика", brakes: "Тормоза", cooling: "Охлаждение", tires: "Шины", km: "км", specialist: "Профиль отмечен в OpenStreetMap", generalShop: "Автосервис — уточните специализацию по телефону", source: "Данные карты: OpenStreetMap. Список зависит от полноты и актуальности отметок на карте.", attribution: "© OpenStreetMap contributors", privacy: "Координаты передаются OpenStreetMap только после нажатия кнопки поиска. AutoFix их не сохраняет.", choose: "Выберите тип работ и радиус. Специализированные мастерские показываются выше, если их профиль отмечен на карте.", openHours: "Часы работы" },
  kk: {
    eyebrow: "AutoFix · жақын жерден іздеу", title: "Автосервис табу", intro: "Ақау түріне қарай жақын шеберханаларды тауып, бағытты ашыңыз.", type: "Нені тексеру керек?", radius: "Іздеу радиусы", location: "Менің орналасқан жерім", nearby: "Жақын жерден іздеу", coordinates: "Немесе координаттарды енгізіңіз", lat: "Ендік", lon: "Бойлық", search: "Координаттар бойынша іздеу", loading: "Сервистер ізделуде…", results: "Жақын сервистер", empty: "Бұл аймақта картада автосервистер белгіленбеген. Радиусты үлкейтіп көріңіз.", useLocation: "Геолокацияға рұқсат беріңіз немесе координаттарды қолмен енгізіңіз.", locateError: "Орналасқан жерді анықтау мүмкін болмады. Геолокацияға рұқсат беріңіз немесе координаттарды енгізіңіз.", invalid: "Ендік пен бойлықты тексеріңіз: ендік −90 мен 90, бойлық −180 мен 180 аралығында болуы керек.", searchError: "Орындарды жүктеу мүмкін болмады. Кейінірек қайталап көріңіз.", rateLimited: "Карта сервисі сұрауларды уақытша шектеді. Біраз күтіп, қайта көріңіз.", mapTitle: "Таңдалған нүкте маңындағы OpenStreetMap картасы", openMap: "Карта", route: "Бағыт", noName: "Автосервис", general: "Диагностика / жалпы жөндеу", engine: "Қозғалтқыш", electrics: "Автоэлектрик", brakes: "Тежегіштер", cooling: "Салқындату жүйесі", tires: "Шиналар", km: "км", specialist: "OpenStreetMap-та мамандануы көрсетілген", generalShop: "Автосервис — мамандануын телефон арқылы нақтылаңыз", source: "Карта деректері: OpenStreetMap. Нәтижелер картадағы белгілердің толықтығы мен өзектілігіне байланысты.", attribution: "© OpenStreetMap contributors", privacy: "Координаттар іздеу түймесін басқаннан кейін ғана OpenStreetMap-ке жіберіледі. AutoFix оларды сақтамайды.", choose: "Жұмыс түрі мен радиусты таңдаңыз. Мамандану картасында көрсетілген сервистер жоғары шығады.", openHours: "Жұмыс уақыты" },
  en: {
    eyebrow: "AutoFix · nearby search", title: "Find a repair shop", intro: "Find nearby garages for the issue and open directions.", type: "What needs attention?", radius: "Search radius", location: "My location", nearby: "Search near me", coordinates: "Or enter coordinates", lat: "Latitude", lon: "Longitude", search: "Search coordinates", loading: "Searching…", results: "Nearby repair shops", empty: "No repair shops are mapped in this area yet. Try a larger radius.", useLocation: "Allow location access or enter coordinates manually.", locateError: "Could not get your location. Allow location access or enter coordinates.", invalid: "Check latitude and longitude: latitude −90 to 90, longitude −180 to 180.", searchError: "Could not load places. Please try again later.", rateLimited: "The map service is temporarily rate limiting requests. Wait a bit and retry.", mapTitle: "OpenStreetMap around the selected location", openMap: "Map", route: "Directions", noName: "Repair shop", general: "Diagnostics / general repair", engine: "Engine", electrics: "Auto electrical", brakes: "Brakes", cooling: "Cooling", tires: "Tires", km: "km", specialist: "Specialty tagged in OpenStreetMap", generalShop: "Repair shop — confirm specialty by phone", source: "Map data: OpenStreetMap. Results depend on the completeness and freshness of map entries.", attribution: "© OpenStreetMap contributors", privacy: "Coordinates are sent to OpenStreetMap only after you press Search. AutoFix does not save them.", choose: "Choose a repair type and radius. Tagged specialists appear first when available.", openHours: "Opening hours" },
} as const;

const ISSUE_KEYS: Issue[] = ["general", "engine", "electrics", "brakes", "cooling", "tires"];
const SPECIAL_TAG: Partial<Record<Issue, string>> = {
  engine: "car_repair",
  electrics: "electrical",
  brakes: "car_repair",
  cooling: "car_repair",
  tires: "tyres",
};

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toPlace(element: OverpassElement, origin: { lat: number; lon: number }): Place | null {
  const point = element.center ?? (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null);
  if (!point) return null;
  const tags = element.tags ?? {};
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = tags["addr:full"] || [street, tags["addr:city"]].filter(Boolean).join(", ");
  const phone = tags["contact:phone"] || tags.phone;
  const website = tags["contact:website"] || tags.website;
  const specialization = tags["service:vehicle:electrical"] === "yes" ? "electrics"
    : tags["service:vehicle:tyres"] === "yes" || tags.shop === "tyres" ? "tires"
      : tags["service:vehicle:car_repair"] === "yes" || tags.shop === "car_repair" || tags.craft === "car_repair" ? "general" : undefined;
  return {
    id: `${element.type}-${element.id}`,
    name: tags.name || tags.brand || tags.operator || "",
    lat: point.lat,
    lon: point.lon,
    distance: haversineKm(origin.lat, origin.lon, point.lat, point.lon),
    address: address || undefined,
    phone: phone || undefined,
    website: website || undefined,
    hours: tags.opening_hours,
    specialization,
  };
}

function ServicesPage() {
  const { settings } = useSettings();
  const t = COPY[settings.language];
  const [issue, setIssue] = useState<Issue>("general");
  const [radius, setRadius] = useState(10);
  const [latText, setLatText] = useState("");
  const [lonText, setLonText] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cache = useRef(new Map<string, Place[]>());

  async function searchAt(lat: number, lon: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      setError(t.invalid);
      return;
    }
    setError("");
    setBusy(true);
    setOrigin({ lat, lon });
    setLatText(lat.toFixed(5));
    setLonText(lon.toFixed(5));
    const cacheKey = `${lat.toFixed(3)}:${lon.toFixed(3)}:${radius}:${issue}`;
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setPlaces(cached);
      setSearched(true);
      setBusy(false);
      return;
    }
    const tag = SPECIAL_TAG[issue];
    const extra = tag ? `nwr(around:${radius * 1000},${lat},${lon})["service:vehicle:${tag}"="yes"];` : "";
    const typeSpecific = issue === "tires" ? `nwr(around:${radius * 1000},${lat},${lon})["shop"="tyres"];` : "";
    const query = `[out:json][timeout:20];(nwr(around:${radius * 1000},${lat},${lon})["shop"="car_repair"];nwr(around:${radius * 1000},${lat},${lon})["craft"="car_repair"];nwr(around:${radius * 1000},${lat},${lon})["amenity"="car_repair"];${extra}${typeSpecific});out center tags;`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) {
        if (response.status === 429 || response.status === 504) throw new Error("RATE_LIMIT");
        throw new Error("SEARCH_FAILED");
      }
      const data = await response.json() as { elements?: OverpassElement[] };
      const next = (data.elements ?? []).map((item) => toPlace(item, { lat, lon })).filter((item): item is Place => item !== null)
        .filter((item) => item.distance <= radius)
        .sort((a, b) => Number(Boolean(b.specialization && (issue === "tires" ? b.specialization === "tires" : issue === "electrics" ? b.specialization === "electrics" : b.specialization === "general"))) - Number(Boolean(a.specialization && (issue === "tires" ? a.specialization === "tires" : issue === "electrics" ? a.specialization === "electrics" : a.specialization === "general"))) || a.distance - b.distance)
        .slice(0, 40);
      cache.current.set(cacheKey, next);
      setPlaces(next);
      setSearched(true);
    } catch (cause) {
      const message = cause instanceof Error && cause.message === "RATE_LIMIT" ? t.rateLimited : t.searchError;
      setError(cause instanceof Error && cause.name === "AbortError" ? t.searchError : message);
      setSearched(false);
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  function findNearby() {
    setError("");
    if (!navigator.geolocation) {
      setError(t.locateError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => void searchAt(position.coords.latitude, position.coords.longitude),
      () => setError(t.locateError),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }

  function searchCoordinates() {
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!latText.trim() || !lonText.trim()) {
      setError(t.invalid);
      return;
    }
    void searchAt(lat, lon);
  }

  const latitudePad = origin ? Math.max(0.025, radius / 111) : 0.1;
  const longitudePad = origin ? latitudePad / Math.max(0.25, Math.cos((origin.lat * Math.PI) / 180)) : 0.1;
  const bbox = origin ? `${origin.lon - longitudePad},${origin.lat - latitudePad},${origin.lon + longitudePad},${origin.lat + latitudePad}` : "";
  const mapSrc = origin ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${origin.lat},${origin.lon}` : "";

  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t.eyebrow}</p>
    <div className="mt-2 flex items-start gap-3"><span className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><MapPinned className="size-5"/></span><div><h1 className="font-display text-4xl tracking-tight">{t.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t.intro}</p></div></div>

    <section className="mt-6 grid gap-5 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_auto] md:items-end md:p-5">
      <label className="block text-sm text-muted">{t.type}<select value={issue} onChange={(event) => setIssue(event.target.value as Issue)} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg">{ISSUE_KEYS.map((key) => <option key={key} value={key}>{t[key]}</option>)}</select></label>
      <label className="block text-sm text-muted">{t.radius}<select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg">{[5, 10, 20, 30].map((value) => <option key={value} value={value}>{value} {t.km}</option>)}</select></label>
      <Button type="button" size="lg" disabled={busy} onClick={findNearby} className="min-h-11 gap-2"><LocateFixed className="size-4"/>{busy ? t.loading : t.nearby}</Button>
      <p className="text-xs text-muted md:col-span-3">{t.choose}</p>
    </section>

    <details className="mt-3 rounded-xl border border-border bg-surface/60 p-4">
      <summary className="cursor-pointer text-sm font-medium text-fg">{t.coordinates}</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs text-muted">{t.lat}<input type="number" step="any" value={latText} onChange={(event) => setLatText(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg"/></label>
        <label className="text-xs text-muted">{t.lon}<input type="number" step="any" value={lonText} onChange={(event) => setLonText(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg"/></label>
        <Button type="button" variant="outline" disabled={busy} onClick={searchCoordinates} className="min-h-10 gap-2"><Search className="size-4"/>{t.search}</Button>
      </div>
    </details>

    <p className="mt-3 text-xs leading-5 text-muted">{t.privacy}</p>
    {error ? <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0"/>{error}</p> : null}

    {origin ? <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <iframe title={t.mapTitle} src={mapSrc} className="h-[360px] w-full border-0" loading="lazy" referrerPolicy="no-referrer"/>
        <p className="px-3 py-2 text-[11px] text-muted"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-primary">{t.attribution}</a></p>
      </section>
      <section>
        <div className="flex items-end justify-between gap-3"><div><h2 className="font-display text-2xl">{t.results}</h2><p className="mt-1 text-xs text-muted">{searched ? `${places.length}` : t.location}</p></div><Navigation className="size-5 text-primary"/></div>
        {!searched && !busy ? <p className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t.useLocation}</p> : null}
        {searched && places.length === 0 ? <p className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t.empty}</p> : null}
        {busy ? <p role="status" className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted">{t.loading}</p> : null}
        <ul className="mt-3 grid max-h-[570px] gap-3 overflow-y-auto pr-1">{places.map((place) => {
          const osmLink = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=17/${place.lat}/${place.lon}`;
          const routeLink = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
          const phoneHref = place.phone ? `tel:${place.phone.replace(/[^+\d]/g, "")}` : undefined;
          return <li key={place.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-medium">{place.name || t.noName}</h3><p className="mt-1 text-xs text-muted">{place.distance < 1 ? `${Math.round(place.distance * 1000)} м` : `${place.distance.toFixed(1)} ${t.km}`}</p></div><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><MapPinned className="size-4"/></span></div>
            {place.address ? <p className="mt-2 text-xs text-muted">{place.address}</p> : null}
            <p className="mt-2 text-xs text-muted">{place.specialization ? `${t.specialist}: ${place.specialization === "tires" ? t.tires : place.specialization === "electrics" ? t.electrics : t.general}` : t.generalShop}</p>
            {place.hours ? <p className="mt-2 text-xs text-muted">{t.openHours}: {place.hours}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">{phoneHref ? <a href={phoneHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs hover:border-primary/50"><Phone className="size-3.5"/>{place.phone}</a> : null}<a href={routeLink} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-fg">{t.route}<ArrowUpRight className="size-3.5"/></a><a href={osmLink} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs hover:border-primary/50">{t.openMap}</a></div>
          </li>;
        })}</ul>
      </section>
    </div> : null}
    <p className="mt-6 text-xs leading-5 text-muted">{t.source}</p>
  </div>;
}
