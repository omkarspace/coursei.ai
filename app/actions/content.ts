"use server";

import { getWikipediaSummary, getRelatedArticles, searchWikipedia } from "@/server/services/wikipedia";
import { verifyWithTavily, isTavilyConfigured } from "@/server/services/verification";

export async function getWikipediaContent(topic: string) {
  const [summary, related] = await Promise.all([
    getWikipediaSummary(topic),
    getRelatedArticles(topic, 3),
  ]);
  return { summary, related };
}

export async function searchWikipediaContent(query: string) {
  return searchWikipedia(query, 5);
}

export async function verifyContent(query: string) {
  if (!isTavilyConfigured()) {
    return { verified: false, sources: [], query, configured: false };
  }
  const result = await verifyWithTavily(query);
  return { ...result, configured: true };
}