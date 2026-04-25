import { useState, useCallback, useRef } from "react";

const SYSTEM_PROMPT = `You are a senior refinery process engineer with 20+ years of CDU/VDU optimization experience.
You are given structured diagnostic output from a CDU performance analysis tool.
Respond in valid JSON only — no markdown fences, no explanation outside the JSON.

Your response must conform to:
{
  "headline": "2-sentence executive summary for the plant manager",
  "topAction": "The single most impactful thing the operator should do in the next 8 hours",
  "marginEstimate": "Estimated margin improvement in $/day if top 3 actions are implemented",
  "riskFlag": "One sentence on the highest operational risk right now, or null if no acute risk"
}`;

export function useAIDiagnostic() {
  const [aiResult, setAiResult]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const lastInputRef              = useRef(null);

  const run = useCallback(async (findings, actions, kpis, apiKey) => {
    if (!apiKey) {
      setError("No API key — enter your Anthropic API key to enable AI insights.");
      return;
    }

    // Cache: skip if input unchanged
    const inputStr = JSON.stringify({ findings: findings.slice(0, 6), actions, kpis });
    if (inputStr === lastInputRef.current) return;
    lastInputRef.current = inputStr;

    setLoading(true);
    setError(null);
    setAiResult(null);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":         "application/json",
          "x-api-key":            apiKey,
          "anthropic-version":    "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 600,
          system:     SYSTEM_PROMPT,
          messages: [{
            role:    "user",
            content: JSON.stringify({ findings, actions, kpis }),
          }],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const raw  = data.content?.[0]?.text || "";
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g, "").trim();
      setAiResult(JSON.parse(cleaned));
    } catch (err) {
      setError(err.message || "AI diagnostic failed. Check your API key and network.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { aiResult, loading, error, run };
}
