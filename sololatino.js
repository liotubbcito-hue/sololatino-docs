const BASE_URL = "https://sololatino.net";

async function searchResults(keyword) {
  try {
    const url = `${BASE_URL}/?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    const html = await res.text();

    const items = [...html.matchAll(
      /<a href="(https:\/\/sololatino\.net\/[^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g
    )].map(m => ({
      title: m[3].trim(),
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

    const descriptionBlock = html.match(/<div class="wp-content">([\s\S]*?)<\/div>/);
    const description = descriptionBlock?.[1]
      ?.replace(/<\/?[^>]+>/g, "")
      ?.replace(/\s+/g, " ")
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

    const episodes = [...html.matchAll(
      /<li[^>]*>\s*<a href="([^"]+)">([^<]+)<\/a>/g
    )].map(m => {
      const num = Number(m[2].replace(/\D+/g, ""));
      return {
        href: m[1].startsWith("http") ? m[1] : `${BASE_URL}${m[1]}`,
        number: num || 1
      };
    });

    return JSON.stringify(episodes);
  } catch (e) {
    return JSON.stringify([]);
  }
}

async function extractStreamUrl(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
    let iframeUrl = iframeMatch?.[1] || "";

    if (iframeUrl && !iframeUrl.startsWith("http")) {
      iframeUrl = `${BASE_URL}${iframeUrl}`;
    }

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
