import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    openapi: "3.0.0",
    info: {
      title: "Datta Studio Pilot API",
      version: "0.1.0",
      description: "Early access API for AI labs to list, discover, and request datasets."
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      { url: "https://your-domain.vercel.app", description: "Production" }
    ],
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/api/pilot/datasets": {
        get: {
          summary: "List datasets",
          parameters: [
            {
              name: "q",
              in: "query",
              description: "Filter by name/tag/description",
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "List of datasets",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      datasets: { type: "array", items: { $ref: "#/components/schemas/Dataset" } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/pilot/datasets/{id}": {
        get: {
          summary: "Get dataset details",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string"} }
          ],
          responses: {
            "200": {
              description: "Dataset detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DatasetDetail" }
                }
              }
            },
            "404": { description: "Not found" }
          }
        }
      },
      "/api/pilot/requests": {
        post: {
          summary: "Submit access request",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccessRequest" }
              }
            }
          },
          responses: {
            "201": {
              description: "Request submitted",
              content: { "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    datasetId: { type: "string" },
                    status: { type: "string" },
                    sla: { type: "string" },
                    receivedAt: { type: "string", format: "date-time" },
                    message: { type: "string" }
                  }
                }
              }}
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key"
        }
      },
      schemas: {
        Dataset: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            size: { type: "string" },
            records: { type: "integer" },
            updatedAt: { type: "string", format: "date-time" },
            tags: { type: "array", items: { type: "string"} }
          }
        },
        DatasetDetail: {
          type: "object",
          properties: {
            id: { type: "string" },
            schema: { type: "object" },
            sample: { type: "array", items: { type: "object" } },
            license: { type: "string" },
            access: { type: "string" }
          }
        },
        AccessRequest: {
          type: "object",
          required: ["datasetId", "company", "contactEmail", "purpose"],
          properties: {
            datasetId: { type: "string" },
            company: { type: "string" },
            contactEmail: { type: "string" },
            purpose: { type: "string" },
            usageWindowDays: { type: "integer" }
          }
        }
      }
    }
  });
}
