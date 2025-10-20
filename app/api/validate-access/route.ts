export const runtime = "edge";

interface ValidateAccessRequest {
  accessCode: string;
}


export async function POST(request: Request): Promise<Response> {
  try {
    const body: ValidateAccessRequest = await request.json();
    const { accessCode } = body;

    if (!accessCode || typeof accessCode !== "string") {
      return Response.json(
        { valid: false, error: "Access code is required" },
        { status: 400 }
      );
    }

    // Get valid access codes from environment variable
    const validCodesEnv = process.env.VALID_ACCESS_CODES;
    if (!validCodesEnv) {
      console.error("VALID_ACCESS_CODES environment variable not set");
      return Response.json(
        { valid: false, error: "Access validation not configured" },
        { status: 500 }
      );
    }

    // Parse comma-separated access codes
    const validCodes = validCodesEnv.split(",").map(code => code.trim().toUpperCase());
    const normalizedAccessCode = accessCode.trim().toUpperCase();

    // Check if access code is valid
    const isValid = validCodes.includes(normalizedAccessCode);

    if (process.env.NODE_ENV !== "production") {
      console.info("[validate-access] validation attempt", {
        accessCode: normalizedAccessCode,
        isValid,
        validCodesCount: validCodes.length,
      });
    }

    if (isValid) {
      // Log successful access (for analytics)
      console.info("[validate-access] access granted", {
        accessCode: normalizedAccessCode,
        timestamp: new Date().toISOString(),
      });

      return Response.json({
        valid: true,
        accessCode: normalizedAccessCode,
      });
    } else {
      // Log failed access attempt (for security monitoring)
      console.warn("[validate-access] access denied", {
        accessCode: normalizedAccessCode,
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        { valid: false, error: "Invalid access code" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("[validate-access] error", error);
    return Response.json(
      { valid: false, error: "Failed to validate access code" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
