"use server";

import { headers } from "next/headers";
import { returnServerError } from "next-safe-action";
import { actionClient } from "@/lib/safe-action";
import { resolveClientIpFromHeaders } from "@/lib/clientIp";
import { submitContactActionSchema } from "@/features/site/contact/customerQuerySchema";
import { createCustomerQuery } from "@/features/site/contact/createCustomerQuery";

function resolveClientIp(headerStore: Headers): string {
  return resolveClientIpFromHeaders(headerStore);
}

/**
 * Contact form server action — same domain path as POST /api/customer-queries.
 * Consent is validated by Zod then stripped before persistence.
 */
export const submitContactAction = actionClient
  .inputSchema(submitContactActionSchema)
  .action(async ({ parsedInput }) => {
    const headerStore = await headers();
    const ip = resolveClientIp(headerStore);

    const { consent: _consent, ...payload } = parsedInput;
    void _consent;

    const result = await createCustomerQuery(payload, { ip });

    if (!result.ok) {
      returnServerError(result.message);
    }

    return {
      queryId: result.queryId,
      createdAt: result.createdAt,
      followUp: result.followUp,
    };
  });
