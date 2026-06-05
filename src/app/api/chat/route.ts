import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { callMcpTool } from "@/lib/mcp-client";
import { getSystemPrompt } from "@/lib/system-prompt";
import { connectToDatabase } from "@/lib/db";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, sessionId } = body;
  console.log("[Chat API] Request body keys:", Object.keys(body));
  console.log("[Chat API] sessionId:", sessionId);
  console.log("[Chat API] messages length:", Array.isArray(messages) ? messages.length : "Not an array: " + typeof messages);
  console.log("[Chat API] messages payload:", JSON.stringify(messages, null, 2));
  
  const converted = await convertToModelMessages(messages);
  console.log("[Chat API] converted messages:", JSON.stringify(converted, null, 2));

  if (sessionId) {
    try {
      const db = await connectToDatabase();
      const collection = db.collection("conversations");
      await collection.updateOne(
        { sessionId },
        {
          $set: {
            messages,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error("[Chat API] Error saving initial user message to DB:", dbError);
    }
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: getSystemPrompt(),
    messages: converted,
    tools: {
      // ─── Search Products ──────────────────────────────
      kapruka_search_products: tool({
        description:
          "Search for products on Kapruka.com by keyword, with optional category filter and pagination. Queries must be at least 3 characters.",
        parameters: z.object({
          q: z
            .string()
            .min(3)
            .describe("Search query (e.g. 'chocolate', 'gift basket')"),
          category: z
            .string()
            .optional()
            .describe("Category filter (e.g. 'Birthday', 'Cakes', 'Flowers')"),
          limit: z
            .number()
            .min(1)
            .max(50)
            .default(10)
            .describe("Results per page"),
          cursor: z
            .string()
            .optional()
            .describe("Pagination cursor from previous response"),
          min_price: z.number().optional().describe("Min price in LKR"),
          max_price: z.number().optional().describe("Max price in LKR"),
          in_stock_only: z
            .boolean()
            .default(false)
            .describe("Only show in-stock items"),
          sort: z
            .enum([
              "relevance",
              "price_asc",
              "price_desc",
              "newest",
              "bestseller",
            ])
            .default("relevance")
            .describe("Sort order"),
        }),
        execute: async (args: any) => {
          const q = args.q || args.keywords || args.query || args.keyword || "";
          const params: any = { q, response_format: "json" };
          const allowedKeys = [
            "category", "limit", "cursor", "currency", 
            "min_price", "max_price", "in_stock_only", 
            "sort", "include_stubs"
          ];
          for (const key of allowedKeys) {
            if (args[key] !== undefined) {
              params[key] = args[key];
            }
          }
          console.log("[MCP Tool] kapruka_search_products args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_search_products", { params });
          return result;
        },
      } as any),

      // ─── Get Product Details ──────────────────────────
      kapruka_get_product: tool({
        description:
          "Get full details for a single Kapruka product by its product ID.",
        parameters: z.object({
          product_id: z
            .string()
            .describe("Kapruka product ID (e.g. 'cake00ka002034')"),
        }),
        execute: async (args: any) => {
          const productId = args.product_id || args.productId || "";
          const params: any = { product_id: productId, response_format: "json" };
          const allowedKeys = ["currency", "type"];
          for (const key of allowedKeys) {
            if (args[key] !== undefined) {
              params[key] = args[key];
            }
          }
          console.log("[MCP Tool] kapruka_get_product args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_get_product", { params });
          return result;
        },
      } as any),

      // ─── List Categories ──────────────────────────────
      kapruka_list_categories: tool({
        description:
          "List top-level Kapruka product categories with browse URLs.",
        parameters: z.object({
          depth: z
            .number()
            .min(1)
            .max(2)
            .default(1)
            .describe("Sub-category levels (1 or 2)"),
        }),
        execute: async (args: any) => {
          const params: any = { response_format: "json" };
          const allowedKeys = ["depth"];
          for (const key of allowedKeys) {
            if (args[key] !== undefined) {
              params[key] = args[key];
            }
          }
          console.log("[MCP Tool] kapruka_list_categories args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_list_categories", { params });
          return result;
        },
      } as any),

      // ─── List Delivery Cities ─────────────────────────
      kapruka_list_delivery_cities: tool({
        description:
          "Search Sri Lankan cities Kapruka delivers to. Use to validate city names before checking delivery.",
        parameters: z.object({
          query: z
            .string()
            .optional()
            .describe("City name search (e.g. 'Colombo', 'Kandy')"),
          limit: z
            .number()
            .min(1)
            .max(50)
            .default(10)
            .describe("Max results"),
        }),
        execute: async (args: any) => {
          const query = args.query || args.q || args.city || "";
          const params: any = { query, response_format: "json" };
          const allowedKeys = ["limit"];
          for (const key of allowedKeys) {
            if (args[key] !== undefined) {
              params[key] = args[key];
            }
          }
          console.log("[MCP Tool] kapruka_list_delivery_cities args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_list_delivery_cities", { params });
          return result;
        },
      } as any),

      // ─── Check Delivery ───────────────────────────────
      kapruka_check_delivery: tool({
        description:
          "Check whether Kapruka can deliver to a city on a given date, and the delivery rate. Pass product_id for perishable warnings.",
        parameters: z.object({
          city: z
            .string()
            .describe("Canonical city name (e.g. 'Colombo 03', 'Kandy')"),
          delivery_date: z
            .string()
            .optional()
            .describe("Delivery date (YYYY-MM-DD), defaults to today"),
          product_id: z
            .string()
            .optional()
            .describe(
              "Product ID — enables perishable warning for cakes/flowers"
            ),
        }),
        execute: async (args: any) => {
          const city = args.city || args.cityName || "";
          const deliveryDate = args.delivery_date || args.deliveryDate || "";
          const productId = args.product_id || args.productId || "";
          const params: any = { city, response_format: "json" };
          if (deliveryDate) params.delivery_date = deliveryDate;
          if (productId) params.product_id = productId;
          console.log("[MCP Tool] kapruka_check_delivery args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_check_delivery", { params });
          return result;
        },
      } as any),

      // ─── Create Order ─────────────────────────────────
      kapruka_create_order: tool({
        description:
          "Create a guest-checkout order on Kapruka and get a payment link. Collect all details before calling.",
        parameters: z.object({
          cart: z.array(
            z.object({
              product_id: z.string(),
              quantity: z.number().default(1),
              icing_text: z.string().optional(),
            })
          ),
          recipient: z.object({
            name: z.string(),
            phone: z.string(),
          }),
          delivery: z.object({
            address: z.string(),
            city: z.string(),
            location_type: z
              .enum(["house", "apartment", "office", "other"])
              .default("house"),
            date: z.string(),
            instructions: z.string().optional(),
          }),
          sender: z.object({
            name: z.string(),
            anonymous: z.boolean().default(false),
          }),
          gift_message: z.string().optional(),
        }),
        execute: async (args: any) => {
          const params: any = { response_format: "json" };
          const allowedKeys = [
            "cart", "recipient", "delivery", "sender", 
            "gift_message", "currency"
          ];
          for (const key of allowedKeys) {
            if (args[key] !== undefined) {
              params[key] = args[key];
            }
          }
          console.log("[MCP Tool] kapruka_create_order args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_create_order", { params });
          return result;
        },
      } as any),

      // ─── Track Order ──────────────────────────────────
      kapruka_track_order: tool({
        description:
          "Track a Kapruka order by order number (from confirmation email, not the checkout order_ref).",
        parameters: z.object({
          order_number: z
            .string()
            .describe("Order number from confirmation email"),
        }),
        execute: async (args: any) => {
          const orderNumber = args.order_number || args.orderNumber || "";
          const params: any = { order_number: orderNumber, response_format: "json" };
          console.log("[MCP Tool] kapruka_track_order args:", args, "sanitized params:", params);
          const result = await callMcpTool("kapruka_track_order", { params });
          return result;
        },
      } as any),
    } as any,
    stopWhen: stepCountIs(5), // Allow multi-step tool use (search → get details → check delivery)
    onFinish: async ({ text, response }: { text: string; response: any }) => {
      console.log("[Chat API] Finished streaming. Text generated:", text);
      console.log("[Chat API] Finished streaming. Response messages:", JSON.stringify(response?.messages, null, 2));
      if (sessionId) {
        try {
          const db = await connectToDatabase();
          const collection = db.collection("conversations");
          const finalMessages = [...messages, ...response.messages];
          await collection.updateOne(
            { sessionId },
            {
              $set: {
                messages: finalMessages,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
        } catch (dbError) {
          console.error("[Chat API] Error saving assistant response to DB:", dbError);
        }
      }
    },
  } as any);

  return result.toUIMessageStreamResponse();
}
