export default {
  fetch(request) {
    console.warn("Worker is running", request.url);
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
