import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

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

    const response = await axios.post(`${esUrl}/${index}/_search`, query, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      httpsAgent,
    });

    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error("ES API Route Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}