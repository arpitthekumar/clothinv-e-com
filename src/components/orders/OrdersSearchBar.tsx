"use client";

import { Search, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function OrdersSearchBar({
  searchTerm,
  setSearchTerm,
  limit,
  setLimit,
  statusFilter,
  setStatusFilter,
  searchBy,
  setSearchBy,
  dateRange,
  setDateRange,
  onOpenDatePicker,
  refresh,
  excludeDelivered,
  setExcludeDelivered,
}: any) {
  function handleRange(value: string) {
    setDateRange(value);
    if (value === "custom") {
      onOpenDatePicker();
      return;
    }
    refresh(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Orders</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          <div className="flex flex-col md:flex-row flex-1 gap-3 w-full">
            <Select value={searchBy} onValueChange={(v) => setSearchBy(v)}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Search By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="invoice">Invoice No.</SelectItem>
                <SelectItem value="name">C-Name</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="id">Order ID</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={`Search by ${searchBy}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refresh(true)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <Button className="flex-1 md:flex-none" onClick={() => refresh(true)}>
                Search
              </Button>

              <Button
                variant="outline"
                className="flex-1 md:flex-none"
                onClick={() => {
                  setSearchTerm("");
                  refresh(true);
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <Button
            variant={excludeDelivered ? "outline" : "destructive"}
            onClick={() => {
              setExcludeDelivered(!excludeDelivered);
              refresh(true);
            }}
            className="whitespace-nowrap"
          >
            {excludeDelivered ? "Hide delivered" : "Show delivered"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Limit</label>
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                refresh(true);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Limit" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter ?? "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? null : v); refresh(true); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium mb-2 block">Date Filter</label>
            <Select value={dateRange} onValueChange={handleRange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range…</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
