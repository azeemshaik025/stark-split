import { NextRequest, NextResponse } from "next/server";
import { canRequestFaucet, recordFaucetRequest } from "@/lib/supabase";
import { sendFaucetTokens } from "@/lib/faucet-server";
import { normalizeStarknetAddress } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address = body?.address ?? body?.recipient;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Missing recipient address" },
        { status: 400 }
      );
    }

    const normalized = normalizeStarknetAddress(address);
    if (!normalized || normalized.length < 10) {
      return NextResponse.json(
        { error: "Invalid recipient address" },
        { status: 400 }
      );
    }

    const allowed = await canRequestFaucet(normalized);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit: one request per address per 24 hours" },
        { status: 429 }
      );
    }

    const { txHash } = await sendFaucetTokens(normalized);
    await recordFaucetRequest(normalized);

    return NextResponse.json({ txHash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("FAUCET_PRIVATE_KEY")) {
      return NextResponse.json(
        { error: "Faucet is not configured" },
        { status: 503 }
      );
    }
    if (
      msg.includes("insufficient") ||
      msg.includes("balance") ||
      msg.includes("exceeds")
    ) {
      return NextResponse.json(
        { error: "Faucet wallet has insufficient funds" },
        { status: 503 }
      );
    }
    console.error("[faucet]", err);
    return NextResponse.json(
      { error: msg || "Faucet request failed" },
      { status: 500 }
    );
  }
}
