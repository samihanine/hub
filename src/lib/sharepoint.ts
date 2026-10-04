import {
  asList,
  callConnector,
  DEV_USER,
  loadContext,
  SHAREPOINT_SOURCE,
} from "@/lib/power-apps";

/**
 * Turns any OneDrive / SharePoint link into the ids the connectors need.
 * Calls go through the SharePoint connector "Send an HTTP request" action, on the SharePoint
 * REST v2 API (same ids as Microsoft Graph: drive "b!…", item "01…").
 *
 * Supported links:
 * - sharing links            https://x.sharepoint.com/:x:/g/personal/user/IQC…?e=…   (also :f: folders, :w:, :b:, /r/…)
 * - Office web links         …/_layouts/15/Doc.aspx?sourcedoc={GUID}&file=…
 * - direct paths             https://x.sharepoint.com/sites/team/Shared Documents/folder/file.xlsx
 */

export type ResolvedItem = {
  siteUrl: string;
  driveId: string;
  itemId: string;
  name: string;
  webUrl: string;
  isFolder: boolean;
};

type DriveItem = {
  id: string;
  name: string;
  webUrl: string;
  folder?: unknown;
  parentReference?: { driveId?: string };
};

const SELECT = "$select=id,name,webUrl,folder,parentReference";
const CACHE_KEY = "hub:links:v1";

/** Site that owns the link: /personal/<user>, /sites/<name>, /teams/<name>, or the root site. */
export function siteOf(link: string) {
  const url = new URL(link);
  const match = url.pathname.match(/\/(personal|sites|teams)\/([^/]+)/i);
  return `${url.origin}${match ? `/${match[1]}/${match[2]}` : ""}`;
}

/** Shares API token: "u!" + base64url(link). */
const shareToken = (link: string) =>
  "u!" +
  btoa(String.fromCharCode(...new TextEncoder().encode(link)))
    .replace(/=+$/, "")
    .replace(/\//g, "_")
    .replace(/\+/g, "-");

async function spRequest<T>(siteUrl: string, uri: string): Promise<T> {
  if (!SHAREPOINT_SOURCE)
    throw new Error(
      'SharePoint connector missing: run "npm run pa:add-sharepoint" to resolve links.',
    );
  const data = await callConnector<unknown>(SHAREPOINT_SOURCE, "HttpRequest", {
    dataset: siteUrl,
    parameters: {
      method: "GET",
      uri,
      headers: { Accept: "application/json;odata=nometadata" },
    },
  });
  // The action returns the response body, sometimes still serialized or wrapped.
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return ((parsed as { body?: unknown })?.body ?? parsed) as T;
}

const toResolved = (siteUrl: string, item: DriveItem): ResolvedItem => {
  if (!item?.id || !item.parentReference?.driveId)
    throw new Error("SharePoint link not found or not accessible");
  return {
    siteUrl,
    driveId: item.parentReference.driveId,
    itemId: item.id,
    name: item.name,
    webUrl: item.webUrl,
    isFolder: !!item.folder,
  };
};

/** Absolute url of a file or folder → drive item, by finding the document library that contains it. */
async function resolvePath(siteUrl: string, absoluteUrl: string) {
  const drives = asList<{ id: string; webUrl: string }>(
    await spRequest<unknown>(siteUrl, "_api/v2.0/drives?$select=id,webUrl"),
  );
  const target = decodeURIComponent(absoluteUrl).toLowerCase();
  const drive = drives
    .filter(
      (d) =>
        target.startsWith(`${decodeURIComponent(d.webUrl).toLowerCase()}/`) ||
        target === decodeURIComponent(d.webUrl).toLowerCase(),
    )
    .sort((a, b) => b.webUrl.length - a.webUrl.length)[0];
  if (!drive) throw new Error(`No document library contains ${absoluteUrl}`);
  const rest = decodeURIComponent(absoluteUrl)
    .slice(decodeURIComponent(drive.webUrl).length)
    .replace(/^\/+/, "");
  const path = rest
    ? `root:/${rest.split("/").map(encodeURIComponent).join("/")}:`
    : "root";
  return toResolved(
    siteUrl,
    await spRequest<DriveItem>(
      siteUrl,
      `_api/v2.0/drives/${drive.id}/${path}?${SELECT}`,
    ),
  );
}

async function resolve(link: string): Promise<ResolvedItem> {
  const url = new URL(link.trim());
  const siteUrl = siteOf(link);

  // Office web link (Doc.aspx?sourcedoc={GUID}): GUID → server relative path → item.
  const sourcedoc = url.searchParams.get("sourcedoc")?.replace(/[{}]/g, "");
  if (sourcedoc) {
    const file = await spRequest<{ ServerRelativeUrl: string }>(
      siteUrl,
      `_api/web/GetFileById('${sourcedoc}')?$select=ServerRelativeUrl`,
    );
    return resolvePath(siteUrl, url.origin + file.ServerRelativeUrl);
  }

  // Sharing link (/:x:/g/…, /:f:/r/…): shares API.
  if (/^\/:[a-z]:\//i.test(url.pathname)) {
    try {
      return toResolved(
        siteUrl,
        await spRequest<DriveItem>(
          siteUrl,
          `_api/v2.0/shares/${shareToken(link.trim())}/driveItem?${SELECT}`,
        ),
      );
    } catch (error) {
      // "/:x:/r/<path>" links also contain the real path: try it before giving up.
      const path = url.pathname.match(/^\/:[a-z]:\/r(\/.*)$/i)?.[1];
      if (!path) throw error;
      return resolvePath(siteUrl, url.origin + path);
    }
  }

  // Direct path.
  return resolvePath(siteUrl, url.origin + url.pathname);
}

/* ------------------------------------------------------------------ */
/* Cache (memory + localStorage: links rarely move)                    */
/* ------------------------------------------------------------------ */

const memory = new Map<string, Promise<ResolvedItem>>();

const readCache = (): Record<string, ResolvedItem> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

export function resolveLink(link: string): Promise<ResolvedItem> {
  if (!memory.has(link)) {
    const cached = readCache()[link];
    memory.set(
      link,
      cached
        ? Promise.resolve(cached)
        : resolve(link).then(
            (item) => {
              try {
                localStorage.setItem(
                  CACHE_KEY,
                  JSON.stringify({ ...readCache(), [link]: item }),
                );
              } catch {
                /* storage blocked: memory cache only */
              }
              return item;
            },
            (error: unknown) => {
              memory.delete(link);
              throw new Error(
                `Unresolved link (${link.slice(0, 60)}…): ${error instanceof Error ? error.message : String(error)}`,
              );
            },
          ),
    );
  }
  return memory.get(link)!;
}

/* ------------------------------------------------------------------ */
/* Connector-specific shapes                                           */
/* ------------------------------------------------------------------ */

export type ExcelTarget = { source: string; drive: string; file: string };

/**
 * Excel connector "source": "me" for the signed-in user's own OneDrive, otherwise the site url
 * (both accepted by the connector).
 */
export async function excelSource(siteUrl: string) {
  const personal = new URL(siteUrl).pathname
    .match(/^\/personal\/([^/]+)/i)?.[1]
    ?.toLowerCase();
  if (!personal) return siteUrl;
  const upn = (await loadContext())?.user.userPrincipalName ?? DEV_USER;
  return upn.toLowerCase().replace(/[@.]/g, "_") === personal ? "me" : siteUrl;
}

/** Path of a SharePoint url relative to its site ("/Documents/Main/images/x.png"). */
export function sitePath(url: string, siteUrl = siteOf(url)) {
  const site = decodeURIComponent(new URL(siteUrl).pathname).replace(/\/$/, "");
  return decodeURIComponent(new URL(url).pathname).slice(site.length) || "/";
}

/** Folder → { dataset, folderPath } for SharePoint "Create file". */
export const folderTarget = (folder: ResolvedItem) => ({
  dataset: folder.siteUrl,
  folderPath: sitePath(folder.webUrl, folder.siteUrl),
});
