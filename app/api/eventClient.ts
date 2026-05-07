import { useEffect, useState } from 'react';
import { Event } from '../types';

const STANFORD_FEED_URL =
  'https://events.stanford.edu/widget/view?schools=stanford&days=7&num=50&format=rss&template=stanford-1-column-compact';

const STANFORD_DEFAULT_COORDS = { lat: 37.4275, lng: -122.1697 };

const CATEGORY_ICONS: Record<string, string> = {
  Academic: '📚',
  Athletics: '⚽',
  Conference: '🎤',
  Exhibition: '🎨',
  'Film/Video': '🎬',
  'Lecture/Seminar/Panel': '🎤',
  Music: '🎵',
  Performance: '🎭',
  Reception: '🥂',
  Religious: '🙏',
  Special: '✨',
  Workshop: '🛠️',
  Other: '📅',
};

const DEFAULT_ICON = '📅';

interface RawRssItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  category: string | undefined;
  imageUrl: string | undefined;
  lat: number | undefined;
  lng: number | undefined;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

function extractTag(itemXml: string, tagName: string): string | undefined {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i');
  const match = itemXml.match(regex);
  if (match === null) {
    return undefined;
  }
  return decodeXml(match[1]).trim();
}

function extractMediaUrl(itemXml: string): string | undefined {
  const match = itemXml.match(/<media:content[^>]*\burl="([^"]+)"/i);
  if (match === null) {
    return undefined;
  }
  return match[1];
}

// Stanford titles often end with " at <Building>"; split on the last " at "
// to recover the location while keeping titles like "Stanford at Cal" intact.
function splitTitleAndLocation(title: string): { cleanTitle: string; location: string | undefined } {
  const separator = ' at ';
  const lastIndex = title.lastIndexOf(separator);
  if (lastIndex === -1) {
    return { cleanTitle: title, location: undefined };
  }
  const cleanTitle = title.slice(0, lastIndex).trim();
  const location = title.slice(lastIndex + separator.length).trim();
  if (cleanTitle.length === 0 || location.length === 0) {
    return { cleanTitle: title, location: undefined };
  }
  return { cleanTitle, location };
}

function formatTimeOfDay(date: Date): string {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }
  const mm = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${hours12}:${mm} ${ampm}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  const lastDigit = day % 10;
  if (lastDigit === 1) return 'st';
  if (lastDigit === 2) return 'nd';
  if (lastDigit === 3) return 'rd';
  return 'th';
}

export function formatDateLabel(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}${ordinalSuffix(day)}`;
}

function rawToEvent(raw: RawRssItem, index: number): Event {
  const { cleanTitle, location } = splitTitleAndLocation(raw.title);
  const parsedDate = new Date(raw.pubDate);
  const category = raw.category ?? 'Other';
  const icon = CATEGORY_ICONS[category] ?? DEFAULT_ICON;

  const coords =
    raw.lat !== undefined && raw.lng !== undefined
      ? { lat: raw.lat, lng: raw.lng }
      : STANFORD_DEFAULT_COORDS;

  const description = raw.description.replace(/\s+/g, ' ').trim();

  return {
    id: raw.link.length > 0 ? raw.link : `stanford-event-${index}`,
    title: cleanTitle,
    description,
    location: location ?? 'Stanford University',
    locationCoords: coords,
    time: formatTimeOfDay(parsedDate),
    date: formatDateLabel(parsedDate),
    organizer: 'Stanford',
    attendees: [],
    category,
    icon,
    imageUrl: raw.imageUrl,
  };
}

function parseRssItems(xml: string): RawRssItem[] {
  const items: RawRssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null = itemRegex.exec(xml);
  while (match !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');
    const link = extractTag(itemXml, 'link');

    if (
      title !== undefined &&
      description !== undefined &&
      pubDate !== undefined &&
      link !== undefined
    ) {
      const latStr = extractTag(itemXml, 'geo:lat');
      const lngStr = extractTag(itemXml, 'geo:long');
      const lat = latStr === undefined ? undefined : Number(latStr);
      const lng = lngStr === undefined ? undefined : Number(lngStr);

      items.push({
        title,
        description,
        pubDate,
        link,
        category: extractTag(itemXml, 'category'),
        imageUrl: extractMediaUrl(itemXml),
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
      });
    }

    match = itemRegex.exec(xml);
  }
  return items;
}

export class EventClient {
  private readonly feedUrl: string;

  constructor(feedUrl: string = STANFORD_FEED_URL) {
    this.feedUrl = feedUrl;
  }

  async fetchEvents(): Promise<Event[]> {
    const response = await fetch(this.feedUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Stanford events feed: ${response.status} ${response.statusText}`,
      );
    }
    const xml = await response.text();
    const rawItems = parseRssItems(xml);
    return rawItems.map((raw, index) => rawToEvent(raw, index));
  }
}

export const eventClient = new EventClient();

export interface UseEventsResult {
  events: Event[];
  isLoading: boolean;
  errorMessage: string | null;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    eventClient
      .fetchEvents()
      .then((fetched) => {
        if (cancelled) return;
        setEvents(fetched);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorMessage(message);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, isLoading, errorMessage };
}
