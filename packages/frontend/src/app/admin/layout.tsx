"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Bot, 
  Settings, 
  Mail, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Usuários", href: "/admin/users", icon: Users },
    { name: "Controle Financeiro", href: "/admin/finance", icon: CreditCard },
    { name: "Controle de IA", href: "/admin/ai", icon: Bot },
    { name: "Comunicações", href: "/admin/communications", icon: Mail },
    { name: "Gerenciamento de permissões", href: "/admin/roles", icon: ShieldCheck },
    { name: "Configurações", href: "/admin/settings", icon: Settings },
    { name: "Gerenciar Blog", href: "/admin/blog", icon: Sparkles },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
            <div className="px-4 py-3 mb-4 border-b border-gray-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Menu Administrativo
              </h2>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href ? (pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))) : false;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href || "#"}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      isActive
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-900/10 dark:text-purple-400"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-purple-600" : "text-gray-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 min-h-[500px]">
          {children}
        </main>

      </div>
    </div>
  );
}
