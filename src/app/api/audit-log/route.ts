import { NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const getEsClient = () => {
  if (!process.env.ES_URL) throw new Error("ES_URL environment variable is missing.");
  return new Client({
    node: process.env.ES_URL,
    auth: { username: process.env.ES_USER || '', password: process.env.ES_PASSWORD || '' },
    tls: { rejectUnauthorized: false },
  });
};

export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ status: "ERROR", message: "Missing Org ID" }, { status: 400 });

    const { esPayload } = await req.json();
    const envRun = process.env.ENV_RUN || 'Development';

    if (esPayload.query && esPayload.query.bool && esPayload.query.bool.must) {
      esPayload.query.bool.must.push({ match_phrase: { "data.Environment": envRun } });
      esPayload.query.bool.must.push({ match: { "data.api.OrgId": orgId.toLowerCase() } });
    }

    const searchPayload: any = { index: "onix-v2*", ...esPayload };
    const esClient = getEsClient();
    const result: any = await esClient.search(searchPayload);

    const responseBody = result.body || result;
    const aggregations = responseBody.aggregations || null;

    const hits = responseBody.hits?.hits || [];
    const rawTotal = responseBody.hits?.total;
    const total = typeof rawTotal === 'number' ? rawTotal : (rawTotal?.value || 0);
    
    const logs = hits.map((hit: any) => ({
      _id: hit._id,
      ...hit._source
    }));

    return NextResponse.json({ 
      status: "OK", 
      data: logs, 
      total, 
      aggregations 
    });

  } catch (error: any) {
    console.error("ES Query Error:", error);
    return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
  }
}