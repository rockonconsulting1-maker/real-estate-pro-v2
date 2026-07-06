import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    width?: number;
  }[];
  rowHeight?: number;
  onRowClick?: (item: T) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 52,
  onRowClick,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? data.length + 1 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  React.useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (
      lastItem &&
      lastItem.index >= data.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage?.();
    }
  }, [virtualItems, data.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} className="h-full overflow-auto relative">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-surface">
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} style={{ width: col.width }}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody
          style={{
            height: data.length === 0 ? 'auto' : `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            virtualItems.map((virtualRow) => {
            const isLoaderRow = virtualRow.index > data.length - 1;
            const item = data[virtualRow.index];

            return (
              <TableRow
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => !isLoaderRow && onRowClick?.(item)}
              >
                {isLoaderRow ? (
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    Loading more...
                  </TableCell>
                ) : (
                  columns.map((col, i) => (
                    <TableCell key={i}>
                      {col.cell ? col.cell(item) : String(item[col.accessorKey as keyof T] || '')}
                    </TableCell>
                  ))
                )}
              </TableRow>
            );
          }))}
        </TableBody>
      </Table>
    </div>
  );
}

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight = 80,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? data.length + 1 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  React.useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (
      lastItem &&
      lastItem.index >= data.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage?.();
    }
  }, [virtualItems, data.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: data.length === 0 ? 'auto' : `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No results found.
          </div>
        ) : (
          virtualItems.map((virtualRow) => {
          const isLoaderRow = virtualRow.index > data.length - 1;
          const item = data[virtualRow.index];

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Loading more...
                </div>
              ) : (
                renderItem(item, virtualRow.index)
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
}
