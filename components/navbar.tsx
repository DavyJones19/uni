"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [openLogout, setOpenLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    // Hard navigation resets in-memory React auth state in all client pages.
    window.location.replace("/");
  };

  return (
    <nav className="flex items-center bg-[#FFC400] px-10 py-2 font-sans w-full">
      {/* Contenedor izquierdo: Logo + Menú */}
      <div className="flex items-center gap-8">
        <Image
          src="/n3-removebg-preview.png"
          alt="TrackSphere logo"
          width={140}
          height={40}
          className="h-12 w-auto object-contain"
          priority
        />
        <div className="flex items-center gap-8 text-sm font-medium">
          <Link
            href="/"
            className="hover:opacity-80 hover:font-bold transition-opacity"
          >
            Inicio
          </Link>
          {/* Puedes agregar más opciones aquí según tu menú real */}
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none hover:opacity-80 hover:font-bold transition-opacity cursor-pointer">
              Seguimiento
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className=" hidden w-56 bg-white p-2 shadow-lg rounded-sm border-none mt-2"
            >
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/catalogos/grupos" className="w-full">
                  GRUPOS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/catalogos/administradores" className="w-full">
                  ADMINISTRADORES
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/catalogos/usuarios" className="w-full">
                  USUARIOS
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none hover:opacity-80 hover:font-bold transition-opacity cursor-pointer">
              Movimientos
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 bg-white p-2 shadow-lg rounded-sm border-none mt-2"
            >
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/movimientos" className="w-full">
                  CONSULTA DE MOVIMIENTOS
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="  outline-none hover:opacity-80 hover:font-bold transition-opacity cursor-pointer">
                Catálogos
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-white p-2 shadow-lg rounded-sm border-none mt-2"
              >
                <DropdownMenuItem
                  asChild
                  className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
                >
                  <Link href="/catalogos/grupos" className="w-full">
                    GRUPOS
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
                >
                  <Link href="/catalogos/administradores" className="w-full">
                    ADMINISTRADORES
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
                >
                  <Link href="" className="w-full">
                    USUARIOS
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none hover:opacity-80 hover:font-bold transition-opacity cursor-pointer">
              Rutas
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="hidden w-56 bg-white p-2 shadow-lg rounded-sm border-none mt-2"
            >
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/catalogos/grupos" className="w-full">
                  GRUPOS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/catalogos/administradores" className="w-full">
                  ADMINISTRADORES
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/catalogos/usuarios" className="w-full">
                  USUARIOS
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none hover:opacity-80 hover:font-bold transition-opacity cursor-pointer">
              Gestionar
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 bg-white p-2 shadow-lg rounded-sm border-none mt-2"
            >
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="" className="w-full">
                  USUARIOS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/gestionar/roles" className="w-full">
                  ROLES
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/gestionar/conductores" className="w-full">
                  Conductores
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="" className="w-full">
                  RUTAS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="" className="w-full">
                  VEHICULOS
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2"
              >
                <Link href="/gestionar/facilities" className="w-full">
                  FACILITIES
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Espaciador flexible para empujar el botón de cerrar sesión a la derecha */}
      <div className="flex-1" />
      {/* Botón cerrar sesión */}
      <div>
        <button
          onClick={() => setOpenLogout(true)}
          className="hover:opacity-80 hover:font-bold transition-opacity"
        >
          Cerrar sesión
        </button>
        <Dialog open={openLogout} onOpenChange={setOpenLogout}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Está seguro de salir?</DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenLogout(false)}>
                No
              </Button>
              <Button onClick={handleLogout}>Sí</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
