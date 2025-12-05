import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Headset,
  Megaphone,
  Target,
  BookOpen,
  ArrowRight,
  FileText,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";

const quickActions = [
  {
    title: "智能问答",
    description: "向 AI 提问产品相关问题",
    href: "/chat",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "客服快速响应",
    description: "生成功能详解和回复话术",
    href: "/templates/customer-service",
    icon: Headset,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "运营推广策划",
    description: "生成卖点总结和营销文案",
    href: "/templates/marketing",
    icon: Megaphone,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "销售策略定制",
    description: "获取定制化攻单策略",
    href: "/templates/sales",
    icon: Target,
    color: "bg-orange-100 text-orange-600",
  },
];

const stats = [
  { name: "知识文档", value: "0", icon: FileText, change: "待添加" },
  { name: "本月问答", value: "0", icon: MessageSquare, change: "次" },
  { name: "模板使用", value: "0", icon: TrendingUp, change: "次" },
  { name: "活跃用户", value: "1", icon: Users, change: "人" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">快速开始</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto font-normal text-primary">
                    立即使用 <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 最近活动 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近对话
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无对话记录</p>
              <Link href="/chat">
                <Button variant="link">开始第一次对话</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              热门文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无文档</p>
              <Link href="/admin/documents/new">
                <Button variant="link">添加第一篇文档</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
