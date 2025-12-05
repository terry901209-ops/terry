"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Wrench,
  BookOpen,
  History,
  Settings,
  Headset,
  Megaphone,
  Target,
} from "lucide-react";

const navigation = [
  { name: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
  { name: "智能问答", href: "/chat", icon: MessageSquare },
  {
    name: "工具箱",
    href: "/templates",
    icon: Wrench,
    children: [
      { name: "客服快速响应", href: "/templates/customer-service", icon: Headset },
      { name: "运营推广策划", href: "/templates/marketing", icon: Megaphone },
      { name: "销售策略定制", href: "/templates/sales", icon: Target },
    ],
  },
  { name: "知识库", href: "/knowledge", icon: BookOpen },
  { name: "历史记录", href: "/history", icon: History },
];

const adminNavigation = [
  { name: "管理后台", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-white border-r lg:block">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">PC</span>
        </div>
        <span className="font-semibold text-lg">像素蛋糕知识库</span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          主菜单
        </div>
        {navigation.map((item) => (
          <div key={item.name}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
            {item.children && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === child.href
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <child.icon className="h-4 w-4" />
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-3">
          管理
        </div>
        {adminNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
