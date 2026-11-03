/**
 * Compresses a server-rendered HTML page with gzip when the browser accepts it.
 *
 * Hosts that sit in front of the app (a CDN, a platform's edge) compress for it. The Node server
 * does not: it serves its prerendered pages and assets from files compressed at build time, but a
 * page rendered per request would leave as plain text, several times larger, on exactly the
 * connections where size matters. This closes that gap where nothing else does, on any runtime
 * (`CompressionStream` is a web standard), and steps aside whenever the response is already
 * encoded, so a proxy that compresses is not asked to compress twice.
 *
 * Only HTML documents are touched. Data responses can stream (a promise resolving in pieces), and
 * a compressor holds output back until it has enough to write, which would undo the streaming.
 */
export function compressResponse(request: Request, response: Response): Response {
	if (request.method !== 'GET' || response.status !== 200 || !response.body) return response;
	if (response.headers.has('content-encoding')) return response;
	if (!(response.headers.get('content-type') ?? '').startsWith('text/html')) return response;
	if (!/\bgzip\b/i.test(request.headers.get('accept-encoding') ?? '')) return response;

	const headers = new Headers(response.headers);
	headers.set('content-encoding', 'gzip');
	// The length of the compressed body is not known up front.
	headers.delete('content-length');
	headers.append('vary', 'Accept-Encoding');

	return new Response(response.body.pipeThrough(new CompressionStream('gzip')), {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
