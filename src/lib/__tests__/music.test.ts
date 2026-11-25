import { afterEach, describe, expect, it, vi } from "vitest";
import { getTrack, searchTracks } from "@/lib/data/music";

const track = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: "Song",
  duration: 30,
  preview: "https://cdns-preview-a.dzcdn.net/stream/1.mp3",
  artist: { name: "Artist" },
  album: { cover_medium: "https://e-cdns-images.dzcdn.net/images/cover/1/250x250.jpg" },
  ...over,
});
const mockFetch = (body: unknown, ok = true) => vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));

afterEach(() => vi.unstubAllGlobals());

describe("deezer adapter", () => {
  it("maps tracks and drops ones without a usable preview or from foreign hosts", async () => {
    mockFetch({
      data: [track(), track({ id: 2, preview: "" }), track({ id: 3, preview: "https://evil.example.com/a.mp3" }), track({ id: 4, album: { cover_medium: "https://evil.example.com/c.jpg" } })],
    });
    const result = await searchTracks("song");
    expect(result).toEqual([{ id: "1", title: "Song", artist: "Artist", cover: "https://e-cdns-images.dzcdn.net/images/cover/1/250x250.jpg", preview: "https://cdns-preview-a.dzcdn.net/stream/1.mp3", duration: 30 }]);
  });

  it("returns null (not an empty list) when the service is down, so the UI can show an error", async () => {
    mockFetch({}, false);
    expect(await searchTracks("x")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await searchTracks("x")).toBeNull();
  });

  it("treats Deezer's in-body error object as a failure", async () => {
    mockFetch({ error: { code: 800 } });
    expect(await getTrack("123")).toBeNull();
  });

  it("does not call the API for a blank query", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await searchTracks("   ")).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});
