"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="flex items-center justify-between bg-[#FFC400] px-10 py-2 font-sans">
      {/* LADO IZQUIERDO: Logo */}
     <div className="flex items-center">
    <Image
      src="/n3-removebg-preview.png"
      alt="TrackSphere logo"
      width={220}
      height={50}
      className="h-12 w-auto object-contain"
      priority
    />
  </div>

      {/* LADO DERECHO: Menú de navegación */}
      <div className="flex items-center gap-10 text-sm font-medium">
        <Link href="/" className="hover:opacity-80 hover:font-bold transition-opacity">
          Inicio
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none hover:opacity-80 hover:font-bold transition-opacity cursor-pointer">
            Catálogos
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
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
              <Link href="/catalogos/usuarios" className="w-full">
                USUARIOS
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setOpenLogout(true)}
          className="hover:opacity-80 hover:font-bold transition-opacity"
        >
          Cerrar sesión
        </button>
      </div>

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
    </nav>
  );
}
