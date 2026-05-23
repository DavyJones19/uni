"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

type MovementRow = {
  mvnt: string;
  eco: string;
  carrier: string;
  operador: string;
  estatus: string;
  origen: string;
  destino: string;
  sta: string;
  enrampe: string;
  updates: string;
  stateDot: "gray" | "green";
};

const sampleRows: MovementRow[] = [
  {
    mvnt: "JHM1100",
    eco: "123",
    carrier: "DHL",
    operador: "Operador",
    estatus: "Resumen Disponible",
    origen: "JJC DHU",
    destino: "HMX DHU",
    sta: "STA",
    enrampe: "Enrampe",
    updates: "Updates",
    stateDot: "green",
  },
  {
    mvnt: "MTJ1300",
    eco: "456",
    carrier: "Carrier",
    operador: "Operador",
    estatus: "Resumen Disponible",
    origen: "MTY DHU",
    destino: "JJC DHU",
    sta: "STA",
    enrampe: "Enrampe",
    updates: "Updates",
    stateDot: "green",
  },
];

export default function MovimientosPage() {
  const [movimiento, setMovimiento] = React.useState("");
  const [estatus, setEstatus] = React.useState("");
  const [carrier, setCarrier] = React.useState("");
  const [fecha, setFecha] = React.useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [tableSearch, setTableSearch] = React.useState("");

  const handleClear = () => {
    setMovimiento("");
    setEstatus("");
    setCarrier("");
    setFecha(undefined);
    setCalendarOpen(false);
  };

  const filteredRows = sampleRows.filter((row) => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) return true;
    return Object.values(row)
      .filter((value) => typeof value === "string")
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <main className="min-h-screen bg-[#f5f2e8] px-3 py-4 text-zinc-900 md:px-6">
      <section className="mx-auto flex w-full max-w-[1560px] flex-col gap-4">
        <header className="space-y-1 px-2">
          <h1 className="text-[28px] font-semibold leading-none tracking-tight text-zinc-700">
            Movimientos del día
          </h1>
        </header>

        <div className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">
                Fecha de salida
              </label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-start rounded-sm border-zinc-300 bg-white px-2 text-left font-normal text-zinc-700 hover:bg-white"
                  onClick={() => setCalendarOpen((value) => !value)}
                >
                  <span className="mr-2 tabular-nums">
                    {fecha ? format(fecha, "dd/MM/yyyy") : "14/05/2026"}
                  </span>
                  <CalendarDays className="ml-auto h-4 w-4 text-zinc-500" />
                </Button>
                {calendarOpen && (
                  <div className="absolute left-0 top-11 z-20 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(day) => {
                        setFecha(day);
                        setCalendarOpen(false);
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">
                Movimiento
              </label>
              <select
                value={movimiento}
                onChange={(event) => setMovimiento(event.target.value)}
                className="h-9 w-full rounded-sm border border-zinc-300 bg-white px-2 text-sm text-zinc-600 outline-none"
              >
                <option value="">MVNT</option>
                <option value="JHM1100">JHM1100</option>
                <option value="MTJ1300">MTJ1300</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">
                Estatus
              </label>
              <select
                value={estatus}
                onChange={(event) => setEstatus(event.target.value)}
                className="h-9 w-full rounded-sm border border-zinc-300 bg-white px-2 text-sm text-zinc-600 outline-none"
              >
                <option value="">Estatus</option>
                <option value="Resumen Disponible">Resumen Disponible</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">
                Carrier
              </label>
              <select
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                className="h-9 w-full rounded-sm border border-zinc-300 bg-white px-2 text-sm text-zinc-600 outline-none"
              >
                <option value="">Carrier</option>
                <option value="DHL">DHL</option>
                <option value="Carrier">Carrier</option>
              </select>
            </div>

            <Button
              type="button"
              className="h-9 w-9 rounded-sm border border-[#E30613] bg-[#E30613] p-0 hover:bg-[#c90511]"
            >
              <Search className="h-5 w-5 text-[#FFD200]" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-300 bg-white px-4 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4 px-1 pb-6">
            <div />
            <div className="relative w-[230px] max-w-full">
              <input
                value={tableSearch}
                onChange={(event) => setTableSearch(event.target.value)}
                placeholder=""
                className="h-8 w-full rounded-sm border border-zinc-300 bg-white px-3 pl-8 text-sm outline-none"
              />
              <Search className="pointer-events-none absolute left-2 top-1.5 h-5 w-5 text-zinc-400" />
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="min-w-full border-separate border-spacing-x-3 border-spacing-y-3 text-sm">
              <thead>
                <tr>
                  <th className="w-10" />
                  {[
                    "MVNT",
                    "ECO",
                    "Carrier",
                    "Operador",
                    "Estatus",
                    "Origen",
                    "Destino",
                    "STA",
                    "Enrampe",
                    "Updates",
                  ].map((header) => (
                    <th
                      key={header}
                      className="rounded-sm bg-zinc-300 px-4 py-2 text-center text-[15px] font-semibold text-zinc-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={`${row.mvnt}-${index}`}>
                    <td className="px-1 py-0">
                      <div
                        className={`h-8 w-8 rounded-full ${
                          row.stateDot === "green"
                            ? "bg-[#008a3d]"
                            : "bg-zinc-300"
                        }`}
                      />
                    </td>
                    {[
                      row.mvnt,
                      row.eco,
                      row.carrier,
                      row.operador,
                      row.estatus,
                      row.origen,
                      row.destino,
                      row.sta,
                      row.enrampe,
                      row.updates,
                    ].map((value, cellIndex) => (
                      <td
                        key={`${row.mvnt}-${cellIndex}`}
                        className="py-0 align-middle"
                      >
                        <div className="min-h-[34px] rounded-sm border border-zinc-300 bg-white px-4 py-1 text-center text-[15px] text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                          {value}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 px-2 py-3 text-zinc-600">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-zinc-700">1</span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
