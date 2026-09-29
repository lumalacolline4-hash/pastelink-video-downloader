import http from "http";

export interface PotServerResponse {
  status: string;
  poToken?: string;
  visitorData?: string;
}

/**
 * Starts a background HTTP provider on localhost for YouTube Proof of Origin (PO) tokens
 * yt-dlp uses PO tokens to bypass bot verification on cloud datacenter IPs
 */
export async function startPotServer(port = 4416): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });

      if (req.url === "/health") {
        res.end(JSON.stringify({ status: "healthy", port }));
        return;
      }

      res.end(
        JSON.stringify({
          status: "ok",
          poToken: process.env.YOUTUBE_PO_TOKEN || "",
          visitorData: process.env.YOUTUBE_VISITOR_DATA || "",
        })
      );
    });

    server.on("error", (err: any) => {
      // If port is already allocated or unavailable, gracefully log and continue
      console.warn(`[POT Server] Note: ${err.message}`);
      resolve(server);
    });

    try {
      server.listen(port, "127.0.0.1", () => {
        console.log(`[POT Server] YouTube PO Token server active on 127.0.0.1:${port}`);
        resolve(server);
      });
    } catch {
      resolve(server);
    }
  });
}
