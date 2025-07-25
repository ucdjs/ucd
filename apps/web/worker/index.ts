export default {
  fetch(request) {
    const url = new URL(request.url);

    // eslint-disable-next-line no-console
    console.log("Request URL:", url.href);

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler;
