/**
 * SoloLatino.js - Script de módulos para SoloLatino.net
 * Versión: 1.0.0
 * Autor: liotubbcito
 * Descripción: Funciones para búsqueda, detalles, episodios y streaming
 */

/**
 * Busca resultados de películas, series y anime
 * @param {string} keyword - Término de búsqueda
 * @returns {string} JSON con resultados
 */
async function searchResults(keyword) {
    const results = [];
    try {
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
        };
        const postdata = `search=${keyword}&limit=50&type=content`;

        const response = await fetchv2("https://sololatino.net/search", headers, "POST", postdata);
        const data = await response.json();

        const regex = /<a href="([^"]+)"[^>]*>.*?<img src="([^"]+)"[^>]*>.*?<span class="title">(.*?)<\/span>/s;

        for (const item of data.results) {
            const match = regex.exec(item);
            if (match) {
                results.push({
                    href: match[1].trim(),
                    image: match[2].trim(),
                    title: match[3].trim()
                });
            }
        }

        return JSON.stringify(results);
    } catch (err) {
        console.error('Error en searchResults:', err);
        return JSON.stringify([{
            title: "Error",
            image: "Error",
            href: "Error"
        }]);
    }
}

/**
 * Extrae detalles de una película, serie o anime
 * @param {string} url - URL del contenido
 * @returns {string} JSON con detalles
 */
async function extractDetails(url) {
    try {
        const response = await fetchv2(url);
        const html = await response.text();

        const descriptionRegex = /<div class="sinopsis">(.*?)<\/div>/s;
        const descriptionMatch = descriptionRegex.exec(html);

        const aliasesRegex = /<span class="aliases">(.*?)<\/span>/s;
        const aliasesMatch = aliasesRegex.exec(html);

        const airdateRegex = /<span class="year">(\d{4})<\/span>/s;
        const airdateMatch = airdateRegex.exec(html);

        const description = descriptionMatch ? descriptionMatch[1]
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim() : "N/A";

        const aliases = aliasesMatch ? aliasesMatch[1].trim() : "N/A";
        const airdate = airdateMatch ? airdateMatch[1].trim() : "N/A";

        return JSON.stringify([{
            description: description,
            aliases: aliases,
            airdate: airdate
        }]);
    } catch (err) {
        console.error('Error en extractDetails:', err);
        return JSON.stringify([{
            description: "Error",
            aliases: "Error",
            airdate: "Error"
        }]);
    }
}

/**
 * Extrae episodios de una serie o anime
 * @param {string} url - URL del contenido
 * @returns {string} JSON con episodios
 */
async function extractEpisodes(url) {
    const results = [];
    try {
        const response = await fetchv2(url);
        const html = await response.text();

        const regex = /<a href="([^"]+)"[^>]*>[\s\S]*?<div class="episode">.*?Epis[oó]dio\s*([0-9]+(?:\.[0-9]+)?)<\/div>/g;

        let match;
        while ((match = regex.exec(html)) !== null) {
            results.push({
                href: match[1].trim(),
                number: Math.round(parseFloat(match[2]))
            });
        }

        return JSON.stringify(results.reverse());
    } catch (err) {
        console.error('Error en extractEpisodes:', err);
        return JSON.stringify([{
            href: "Error",
            number: "Error"
        }]);
    }
}

/**
 * Extrae la URL de streaming del contenido
 * @param {string} url - URL del episodio o película
 * @returns {string} URL del stream HLS
 */
async function extractStreamUrl(url) {
    try {
        const response = await fetchv2(url);
        const html = await response.text();

        // Buscar iframe con video
        const iframeRegex = /<iframe[^>]*src=["']\s*([^"']*(?:anivideo|stream|player)[^"']*?)\s*["'][^>]*>/i;
        const iframeMatch = html.match(iframeRegex);

        if (!iframeMatch) {
            console.warn('No iframe encontrado');
            return "https://files.catbox.moe/avolvc.mp4";
        }

        const apiUrl = iframeMatch[1];

        const apiResponse = await fetchv2(apiUrl);
        const apiHtml = await apiResponse.text();

        // Buscar m3u8 (HLS)
        const m3u8Regex = /file:\s*['"]([^'"]*\.m3u8[^'"]*)['"]/i;
        const m3u8Match = apiHtml.match(m3u8Regex);

        if (m3u8Match) {
            return m3u8Match[1];
        }

        // Buscar URL de video directo
        const videoRegex = /(?:src|url)=["']\s*([^"']*\.mp4[^"']*)\s*["']/i;
        const videoMatch = apiHtml.match(videoRegex);

        if (videoMatch) {
            return videoMatch[1];
        }

        return "https://files.catbox.moe/avolvc.mp4";

    } catch (err) {
        console.error('Error en extractStreamUrl:', err);
        return "https://files.catbox.moe/avolvc.mp4";
    }
}
