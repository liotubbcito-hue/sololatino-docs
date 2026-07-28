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

        // Busca cualquier enlace dentro de artículos con imagen
        const regex = /<article[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

        let match;
        while ((match = regex.exec(html)) !== null) {
            const href = absoluteUrl(match[1]);
            const block = match[2];

            const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
            const titleMatch = block.match(/title=["']([^"']+)["']/i);

            let title = '';
            if (titleMatch) {
                title = decodeHtml(titleMatch[1].trim());
            } else {
                // fallback: texto visible
                title = decodeHtml(block.replace(/<[^>]+>/g, '').trim());
            }

            if (title && href) {
                results.push({
                    title,
                    image: imgMatch ? absoluteUrl(imgMatch[1]) : '',
                    href
                });
            }
        }

        return JSON.stringify(results);
    } catch (e) {
        return JSON.stringify([]);
    }
}
