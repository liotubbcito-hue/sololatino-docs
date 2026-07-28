const BASE_URL = 'https://sololatino.net';

async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    const headers = options.headers || {};
    headers['User-Agent'] = 'Mozilla/5.0';
    try {
        return await fetchv2(url, headers, options.method || 'GET', options.body || null);
    } catch (e) {
        return null;
    }
}

function abs(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    return BASE_URL + (url.startsWith('/') ? url : '/' + url);
}

async function searchResults(keyword) {
    try {
        const res = await soraFetch(`${BASE_URL}/?s=${encodeURIComponent(keyword)}`);
        if (!res) return JSON.stringify([]);

        const html = await res.text();
        const out = [];

        // Busca enlaces de entradas
        const regex = /href=["'](https?:\/\/sololatino\.net\/[^"']+)["'][^>]*>([^<]{2,})</gi;

        let m;
        while ((m = regex.exec(html)) !== null) {
            const href = m[1];
            const title = m[2].trim();

            if (title.length > 2) {
                out.push({
                    title: title,
                    image: '',
                    href: href
                });
            }
        }

        return JSON.stringify(out.slice(0, 20));
    } catch (e) {
        return JSON.stringify([]);
    }
}

async function extractDetails(url) {
    return JSON.stringify([{
        description: '',
        aliases: '',
        airdate: ''
    }]);
}

async function extractEpisodes(url) {
    return JSON.stringify([{
        href: url,
        number: 1
    }]);
}

async function extractStreamUrl(url) {
    try {
        const res = await soraFetch(url);
        if (!res) return JSON.stringify({ streams: [] });

        const html = await res.text();
        const streams = [];

        const re = /<iframe[^>]+src=["']([^"']+)["']/gi;
        let m;

        while ((m = re.exec(html)) !== null) {
            streams.push({
                title: 'Servidor',
                streamUrl: abs(m[1]),
                headers: {
                    Referer: BASE_URL
                }
            });
        }

        return JSON.stringify({ streams });
    } catch (e) {
        return JSON.stringify({ streams: [] });
    }
}
