"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }

    return pages;
  };

  const btnClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium";
  const activeBtnClass = `${btnClass} border-emerald-500 bg-emerald-500/20 text-emerald-400`;
  const defaultBtnClass = `${btnClass} border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        className={defaultBtnClass}
        aria-label="Primera página"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={defaultBtnClass}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-slate-600">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? activeBtnClass : defaultBtnClass}
          >
            {page + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={defaultBtnClass}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage >= totalPages - 1}
        className={defaultBtnClass}
        aria-label="Última página"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
