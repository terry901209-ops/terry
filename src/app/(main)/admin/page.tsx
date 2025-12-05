import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Layers, Settings, ArrowRight } from "lucide-react";

const adminSections = [
  {
    title: "文档管理",
    description: "添加、编辑和管理知识库文档",
    href: "/admin/documents",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "模板管理",
    description: "管理提示词模板和表单配置",
    href: "/admin/templates",
    icon: Layers,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "系统设置",
    description: "配置系统参数和用户权限",
    href: "/admin/settings",
    icon: Settings,
    color: "bg-gray-100 text-gray-600",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">管理后台</h1>
        <p className="text-muted-foreground">
          管理知识库内容、模板配置和系统设置
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${section.color}`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 h-auto font-normal text-primary">
                  进入管理 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
