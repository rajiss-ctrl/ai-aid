
// lib/ai.ts
// Cloudflare Workers AI — free, no quota issues
// Model: Llama 3.1 8B — replaces deprecated llama-3-8b-instruct

const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function streamAIChat(
  messages: Message[],
  orgName: string = "the organization",
  niche: string = "default"
) {
  // Add system message if not present
  const hasSystem = messages.some((m) => m.role === "system");
  const fullMessages = hasSystem
    ? messages
    : [
        {
          role: "system" as const,
          content: `You are a helpful AI assistant for ${orgName}. Be concise and professional.`,
        },
        ...messages,
      ];

  const response = await fetch(
    `${CLOUDFLARE_URL}/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: fullMessages,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare AI error: ${error}`);
  }

  // Track token counts
  let promptTokens = 0;
  let completionTokens = 0;
  const encoder = new TextEncoder();

  // Create readable stream that emits SSE chunks
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const text = parsed.response ?? "";
              if (text) {
                fullText += text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text })}\n\n`
                  )
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Estimate tokens (Cloudflare doesn't return exact counts)
        promptTokens = Math.ceil(
          fullMessages.reduce((acc, m) => acc + m.content.length, 0) / 4
        );
        completionTokens = Math.ceil(fullText.length / 4);

        // Signal done
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              usage: {
                promptTokens,
                completionTokens,
                total: promptTokens + completionTokens,
              },
              cost: 0,
            })}\n\n`
          )
        );

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return {
    stream,
    getUsage: () => ({ promptTokens, completionTokens }),
  };
}









