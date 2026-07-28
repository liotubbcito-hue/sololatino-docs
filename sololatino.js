const BASE = "https://sololatino.net";

async function searchResults(keyword) {
  try {
    const url = `${BASE}/?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    const html = await res.text();

    const results = [...html.matchAll(
      /<a href="(https:\/\/sololatino\.net\/[^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g
    )].map(m => ({
      title: m[3].trim(),
      image: m[2],
      href: m[1]
    }));

    return JSON.stringify(results);
  } catch (err) {
    return JSON.stringify([]);
  }
}

async function extractDetails(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const desc = html.match(/<div class="wp-content">([\s\S]*?)<\/div>/)?.[1]
      ?.replace(/<\/?[^>]+>/g, "")
      ?.replace(/\s+/g, " ")
      ?.trim() || "";

    return JSON.stringify({
      description: desc,
      aliases: "",
      airdate: ""
    });
  } catch (err) {
    return JSON.stringify({});
  }
}

async function extractEpisodes(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const eps = [...html.matchAll(
      /<li[^>]*>\s*<a href="([^"]+)">([^<]+)<\/a>/g
    )].map(m => {
      const number = Number(m[2].replace(/\D+/g, ""));
      const href = m[1].startsWith("http") ? m[1] : `${BASE}${m[1]}`;
      return { href, number };
    });

    return JSON.stringify(eps);
  } catch (err) {
    return JSON.stringify([]);
  }
}

async function extractStreamUrl(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    let iframe = html.match(/<iframe[^>]+src="([^"]+)"/)?.[1] || "";

    if (iframe && !iframe.startsWith("http")) {
      iframe = `${BASE}${iframe}`;
    }

    return JSON.stringify({
      streams: [
        {
          title: "Servidor Principal",
          streamUrl: iframe,
          headers: {}
        }
      ]
    });
  } catch (err) {
    return JSON.stringify({});
  }
}
