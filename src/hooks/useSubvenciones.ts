"use client";

import { useState, useEffect, useRef } from "react";
import { SearchFilters, SubvencionesResponse } from "@/lib/types";
import { fetchSubvenciones } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";

const EMPTY: SubvencionesResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: PAGE_SIZE,
  first: true,
  last: true,
  empty: true,
  numberOfElements: 0,
};

export function useSubvenciones(filters: SearchFilters, page: number) {
  const [data, setData] = useState<SubvencionesResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    fetchSubvenciones(filters, page)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message ?? "Error desconocido");
        setLoading(false);
      });
  }, [filters, page]);

  return { data, loading, error };
}
