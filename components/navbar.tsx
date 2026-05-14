"use client";

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="flex items-center justify-between bg-[#b59445] px-10 py-3 text-white font-sans">
      {/* LADO IZQUIERDO: Logo */}
      <div className="flex-shrink-0">
        <Image 
          src="/logo_nuevo.jpeg" // Asegúrate de que el nombre coincida
          alt="Mistalentos Logo"
          width={250} 
          height={60}
          className="bg-white p-1" // El fondo blanco que se ve en tu imagen
        />
      </div>

      {/* LADO DERECHO: Menú de navegación */}
      <div className="flex items-center gap-10 text-sm font-medium">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          Inicio
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none hover:opacity-80 transition-opacity cursor-pointer">
            Catálogos
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white p-2 shadow-lg rounded-sm border-none mt-2">
            <DropdownMenuItem className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2">
              <Link href="/catalogos/grupos" className="w-full">GRUPOS</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2">
              <Link href="/catalogos/administradores">ADMINISTRADORES</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-slate-100 cursor-pointer text-slate-700 font-medium uppercase text-xs tracking-wider p-2">
              <Link href="/catalogos/usuarios" className="w-full">USUARIOS</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button 
          onClick={() => setOpenLogout(true)}
          className="hover:opacity-80 transition-opacity"
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
            <Button onClick={handleLogout}>
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}