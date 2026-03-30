import axios from "axios";

export interface SensorOverviewPayload {
  gte?: string;
  lte?: string;
  interval?: string;
  size?: number;
}

export const sensorStatsApi = {
  getOverview: async (sensorId: string, payload: SensorOverviewPayload = {}) => {
    const indexName = "onix-v2-agent-stats-*";
    const queryMust: any[] = [
      { term: { "data.node_id.keyword": "983f2a53-9d16-4ba5-be9c-2e5abdcb1cb5" } }
    ];

    if (payload.gte) {
      const rangeQuery: any = { gte: payload.gte };
      if (payload.lte) rangeQuery.lte = payload.lte;
      queryMust.push({ range: { "@timestamp": rangeQuery } });
    }

    const esQuery = {
      size: payload.size || 50,
      sort: [{ "@timestamp": { order: "desc" } }],
      query: { bool: { must: queryMust } },
      aggs: {
        timeline: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: payload.interval || "30m",
            min_doc_count: 0,
            extended_bounds: payload.gte && payload.lte ? {
              min: payload.gte,
              max: payload.lte
            } : undefined
          }
        }
      }
    };

    const response = await axios.post("/api/elasticsearch", {
      index: indexName,
      query: esQuery
    });

    return response.data;
  }
};