"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Pagination } from "./Pagination";

type ServerPaginationProps = {
  totalItems: number;
  itemsPerPage: number;
};

export function ServerPagination({ totalItems, itemsPerPage }: ServerPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
    />
  );
}
