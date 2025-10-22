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
    
    // Enhanced logging for debugging on Netlify
    console.log("[validate-access] Environment check:", {
      hasValidCodes: !!validCodesEnv,
      validCodesLength: validCodesEnv?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      validCodesPreview: validCodesEnv ? validCodesEnv.substring(0, 10) + "..." : "NOT SET",
      // Show all env var names (except sensitive ones) to debug
      availableEnvVars: Object.keys(process.env)
        .filter(key => !key.includes('API_KEY'))
        .sort()
    });
    
    if (!validCodesEnv) {
      console.error("[validate-access] CRITICAL: VALID_ACCESS_CODES environment variable not set");
      console.error("[validate-access] This usually means:");
      console.error("  1. Environment variable not set in Netlify dashboard");
      console.error("  2. Variable set as 'secret' instead of regular variable");
      console.error("  3. New deploy needed after setting variable");
      return Response.json(
        { valid: false, error: "Access validation not configured. Please contact administrator." },
        { status: 500 }
      );
    }

    // Parse comma-separated access codes
    const validCodes = validCodesEnv.split(",").map(code => code.trim().toUpperCase());
    const normalizedAccessCode = accessCode.trim().toUpperCase();

    // Check if access code is valid
    const isValid = validCodes.includes(normalizedAccessCode);

    // Always log validation attempts (helpful for debugging on Netlify)
    console.log("[validate-access] Validation attempt:", {
      accessCodeReceived: normalizedAccessCode,
      isValid,
      validCodesCount: validCodes.length,
      timestamp: new Date().toISOString(),
    });

    if (isValid) {
      // Log successful access
      console.log("[validate-access] ✅ ACCESS GRANTED", {
        accessCode: normalizedAccessCode,
        timestamp: new Date().toISOString(),
      });

      return Response.json({
        valid: true,
        accessCode: normalizedAccessCode,
      });
    } else {
      // Log failed access attempt
      console.log("[validate-access] ❌ ACCESS DENIED - Invalid code", {
        accessCodeAttempted: normalizedAccessCode,
        timestamp: new Date().toISOString(),
        hint: "Check if this code exists in VALID_ACCESS_CODES environment variable"
      });

      return Response.json(
        { valid: false, error: "Invalid access code" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("[validate-access] ⚠️ UNEXPECTED ERROR:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
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
