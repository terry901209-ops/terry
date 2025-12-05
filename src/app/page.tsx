import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Megaphone, Target, Headset, BookOpen, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PC</span>
            </div>
            <span className="font-semibold text-lg">像素蛋糕知识库</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          像素蛋糕产品知识库
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          专为客服、销售、运营和营销人员打造的 AI 智能知识库，
          快速获取产品功能、卖点和使用场景等专业知识。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              开始使用 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/knowledge">
            <Button size="lg" variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" /> 浏览知识库
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>智能问答</CardTitle>
              <CardDescription>
                自然语言交互，AI 精准回答产品相关问题
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                支持自由提问，回答附带引用来源，确保信息准确可靠
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Headset className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>客服快速响应</CardTitle>
              <CardDescription>
                一键生成功能详解和标准回复话术
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                输入功能名称和用户问题，快速获取专业解答
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Megaphone className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>运营推广策划</CardTitle>
              <CardDescription>
                自动生成卖点总结和营销文案
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                针对特定功能和活动，产出专业营销方案
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>销售策略定制</CardTitle>
              <CardDescription>
                针对不同客户类型提供定制化攻单策略
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                推荐功能组合，直击客户痛点的话术策略
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好提升工作效率了吗？</h2>
          <p className="text-lg opacity-90 mb-8">
            立即登录，开始使用像素蛋糕产品知识库
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="gap-2">
              立即开始 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; 2024 像素蛋糕. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
