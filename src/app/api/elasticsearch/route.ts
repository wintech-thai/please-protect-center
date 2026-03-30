import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { index, query } = body;

    const esUrl = process.env.ES_URL?.replace(/\/$/, "");
    const esUser = process.env.ES_USER;
    const esPassword = process.env.ES_PASSWORD;

    if (!esUrl || !esUser || !esPassword) {
      return NextResponse.json({ error: "Elasticsearch credentials missing in .env" }, { status: 500 });
    }

    const auth = Buffer.from(`${esUser}:${esPassword}`).toString("base64");

    const response = await fetch(`${esUrl}/${index}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify(query),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("ES API Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}