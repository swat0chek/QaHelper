import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

public class Main {
    private static final Map<String, String> ROUTES = Map.ofEntries(
            Map.entry("/", "index.html"),
            Map.entry("/http-codes", "http-codes.html"),
            Map.entry("/styles.css", "styles.css"),
            Map.entry("/data.js", "data.js"),
            Map.entry("/knowledge.js", "knowledge.js"),
            Map.entry("/app.js", "app.js")
    );

    private static final Set<String> MODULES = Set.of(
            "devtools", "api-testing", "sql", "bug-reports", "test-cases", "test-design",
            "http", "browser-storage", "git", "command-line", "mobile-qa", "logs",
            "security", "performance", "automation", "ci-cd", "architecture",
            "testing-types", "qa-metrics", "glossary"
    );

    private static String resolveFile(String path) {
        String file = ROUTES.get(path);
        if (file != null) return file;
        if (path.startsWith("/") && MODULES.contains(path.substring(1))) return "module.html";
        if (path.startsWith("/modules/") && path.endsWith(".js")) {
            String id = path.substring("/modules/".length(), path.length() - 3);
            if (MODULES.contains(id)) return "modules/" + id + ".js";
        }
        return null;
    }

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        Path webRoot = Path.of("web").toAbsolutePath();
        if (!Files.isRegularFile(webRoot.resolve("index.html"))) {
            throw new IllegalStateException("Run from the project root: web/index.html was not found.");
        }
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/", exchange -> handle(exchange, webRoot));
        Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(0)));
        server.start();
        System.out.println("QA Helpers: http://localhost:" + port + " (Ctrl+C to stop)");
    }

    private static void handle(HttpExchange exchange, Path webRoot) throws IOException {
        try (exchange) {
            String method = exchange.getRequestMethod();
            if (!method.equals("GET") && !method.equals("HEAD")) {
                exchange.getResponseHeaders().set("Allow", "GET, HEAD");
                respond(exchange, 405, "text/plain", "Method not allowed".getBytes(StandardCharsets.UTF_8));
                return;
            }
            String file = resolveFile(exchange.getRequestURI().getPath());
            if (file == null) {
                respond(exchange, 404, "text/html", ("<!doctype html><html lang=\"ru\"><meta charset=\"utf-8\">"
                        + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
                        + "<title>404 — QA Helpers</title><link rel=\"stylesheet\" href=\"/styles.css\">"
                        + "<main class=\"container hero\"><p class=\"eyebrow\">404 / NOT FOUND</p>"
                        + "<h1>Страница не найдена</h1><a class=\"back-link\" href=\"/\">← На главную</a></main></html>")
                        .getBytes(StandardCharsets.UTF_8));
                return;
            }
            String type = file.endsWith(".css") ? "text/css"
                    : file.endsWith(".js") ? "text/javascript" : "text/html";
            respond(exchange, 200, type, Files.readAllBytes(webRoot.resolve(file)));
        }
    }

    private static void respond(HttpExchange exchange, int status, String type, byte[] body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", type + "; charset=utf-8");
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache");
        if (exchange.getRequestMethod().equals("HEAD")) {
            exchange.getResponseHeaders().set("Content-Length", String.valueOf(body.length));
            exchange.sendResponseHeaders(status, -1);
        } else {
            exchange.sendResponseHeaders(status, body.length);
            exchange.getResponseBody().write(body);
        }
    }
}
