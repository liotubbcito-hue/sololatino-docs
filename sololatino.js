async function searchResults(keyword) {
  try {
    const url = `https://sololatino.net/?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    const html = await res.text();

    const items = [...html.matchAll(/<a href="(https:\/\/sololatino\.net\/[^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"/g)]
      .map(m => ({
        title: m[3],
        image: m[2],
        href: m[1]
      }));

    return JSON.stringify(items);
  } catch (e) {
    return JSON.stringify([]);
  }
}

async function extractDetails(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const description = html.match(/<div class="wp-content">([\s\S]*?)<\/div>/)?.[1]
      ?.replace(/<[^>]+>/g, "")
      ?.trim() || "";

    return JSON.stringify({
      description,
      aliases: "",
      airdate: ""
    });
  } catch (e) {
    return JSON.stringify({});
  }
}

async function extractEpisodes(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const episodes = [...html.matchAll(/<li[^>]*>\s*<a href="([^"]+)">([^<]+)<\/a>/g)]
      .map(m => ({
        href: m[1],
        number: Number(m[2].replace(/\D+/g, ""))
      }));

    return JSON.stringify(episodes);
  } catch (e) {
    return JSON.stringify([]);
  }
}

async function extractStreamUrl(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const iframeUrl = html.match(/<iframe[^>]+src="([^"]+)"/)?.[1];

    return JSON.stringify({
      streams: [
        {
          title: "Servidor Principal",
          streamUrl: iframeUrl,
          headers: {}
        }
      ]
    });
  } catch (e) {
    return JSON.stringify({});
  }
}
