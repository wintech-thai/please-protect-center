import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

async function handleProxy(
  req: NextRequest,
  { params }: { params: any } 
) {
  try {
    if (!API_BASE_URL) {
      console.error("Proxy Error: API Base URL is not defined (missing NEXT_PUBLIC_API_URL or BACKEND_URL).");
      return NextResponse.json(
        { message: "Server Configuration Error: Missing API URL" }, 
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const pathArray = resolvedParams.path || resolvedParams.slug || []; 
    const endpoint = pathArray.join("/");
    
    const queryParams = req.nextUrl.search; 
    
    const targetUrl = `${API_BASE_URL}/${endpoint}${queryParams}`;

    console.log(`Proxying [${req.method}] to: ${targetUrl}`);

    let body: any = null;
    const contentType = req.headers.get("content-type");

    if (req.method !== "GET" && req.method !== "HEAD") {
      const textBody = await req.text();
      if (textBody) {
        try {
          body = JSON.parse(textBody);
        } catch {
          body = textBody; 
        }
      }
    }

    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;

    const isLoginPath = endpoint.toLowerCase().includes("login");
    if (!isLoginPath) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) headers["Authorization"] = authHeader;
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: body,
      validateStatus: () => true,
      responseType: 'arraybuffer' 
    });

    const responseHeaders = new Headers();
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value && !['content-length', 'content-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, String(value));
      }
    });

    return new NextResponse(response.data, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error: any) {
    console.error(`[Proxy Crash]:`, error.message);
    return NextResponse.json(
      { message: "Proxy Connection Failed", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, props: any) { return handleProxy(req, props); }
export async function POST(req: NextRequest, props: any) { return handleProxy(req, props); }
export async function PUT(req: NextRequest, props: any) { return handleProxy(req, props); }
export async function DELETE(req: NextRequest, props: any) { return handleProxy(req, props); }
export async function PATCH(req: NextRequest, props: any) { return handleProxy(req, props); }