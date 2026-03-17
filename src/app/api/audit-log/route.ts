import { NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const getEsClient = () => {
  if (!process.env.ES_URL) {
    throw new Error("ES_URL environment variable is missing.");
  }
  return new Client({
    node: process.env.ES_URL,
    auth: {
      username: process.env.ES_USER || '',
      password: process.env.ES_PASSWORD || '',
    },
    tls: { rejectUnauthorized: false },
    headers: {
      'Accept': 'application/vnd.elasticsearch+json; compatible-with=8',
      'Content-Type': 'application/vnd.elasticsearch+json; compatible-with=8'
    }
  });
};

export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ status: "ERROR", message: "Missing Org ID" }, { status: 400 });

    const { esPayload } = await req.json();
    const envRun = process.env.ENV_RUN || 'DEV';

    if (esPayload.query && esPayload.query.bool && esPayload.query.bool.must) {
      esPayload.query.bool.must.push({ match: { "data.Environment": envRun } });
      esPayload.query.bool.must.push({ match: { "data.api.OrgId": orgId } });
    }

    const searchPayload: any = {
      index: "onix-v2*",
      ...esPayload
    };

    const esClient = getEsClient();
    const result = await esClient.search(searchPayload);

    const hits = result.hits?.hits || (result as any).body?.hits?.hits || [];
    const rawTotal = result.hits?.total || (result as any).body?.hits?.total;
    const total = typeof rawTotal === 'number' ? rawTotal : (rawTotal?.value || 0);
    
    const logs = hits.map((hit: any) => ({
      _id: hit._id,
      ...hit._source
    }));

    return NextResponse.json({ status: "OK", data: logs, total });

  } catch (error: any) {
    console.error("ES Query Error:", error);
    return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
  }
}