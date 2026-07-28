const BASE_URL = 'https://sololatino.net';

async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    const headers = options.headers || {};
    if (!headers['User-Agent']) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }
    try {
        return await fetchv2(url, headers, options.method || 'GET', options.body || null);
    } catch (e) {
        return null;
    }
}

function absoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    return BASE_URL + (url.startsWith('/') ? url : '/' + url);
}

function decodeHtml(text) {
    return text
        .replace(/&/g, '&')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/</g, '<')
        .replace(/>/g, '>');
}

async function searchResults(keyword) {
    try {
        const url = `${BASE_URL}/?s=${encodeURIComponent(keyword)}`;
        const res = await soraFetch(url);
        if (!res) return JSON.stringify([]);

        const html = await res.text();
        const results = [];

        const regex = /<a[^>]+href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][\\s\\S]*?<img[^>]+src=["']([^"']+)["']/gi;

        let match;
        while ((match = regex.exec(html)) !== null) {
            results.push({
                title: decodeHtml(match[2].trim()),
                image: absoluteUrl(match[3]),
                href: absoluteUrl(match[1])
            });
        }

        return JSON.stringify(results);
    } catch (e) {
        return JSON.stringify([]);
    }
}

async function extractDetails(url) {
    try {
        const res = await soraFetch(url);
        if (!res) {
            return JSON.stringify([{
                description: '',
                aliases: '',
                airdate: ''
            }]);
        }

        const html = await res.text();

        let description = '';
        const descMatch = html.match(/<p[^>]*class=["'][^"']*?(?:sinopsis|overview|description)[^"']*["'][^>]*>([\\s\\S]*?)<\\/p>/i);
        if (descMatch) {
            description = decodeHtml(descMatch[1].replace(/<[^>]+>/g, '').trim());
        }

        return JSON.stringify([{
            description,
            aliases: '',
            airdate: ''
        }]);
    } catch (e) {
        return JSON.stringify([{
            description: '',
            aliases: '',
            airdate: ''
        }]);
    }
}

async function extractEpisodes(url) {
    try {
        return JSON.stringify([
            {
                href: url,
                number: 1
            }
        ]);
    } catch (e) {
        return JSON.stringify([]);
    }
}

async function extractStreamUrl(url) {
    try {
        const res = await soraFetch(url);
        if (!res) {
            return JSON.stringify({ streams: [] });
        }

        const html = await res.text();

        const streams = [];

        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
        let match;

        while ((match = iframeRegex.exec(html)) !== null) {
            const iframeUrl = absoluteUrl(match[1]);

            streams.push({
                title: 'Servidor',
                streamUrl: iframeUrl,
                headers: {
                    Referer: BASE_URL,
                    'User-Agent': 'Mozilla/5.0'
                }
            });
        }

        return JSON.stringify({ streams });
    } catch (e) {
        return JSON.stringify({ streams: [] });
    }
}
