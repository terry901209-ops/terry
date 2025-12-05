"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Loader2,
  Eye,
  Search,
} from "lucide-react";
import { Document } from "@/types/database";

const categories = [
  { value: "feature", label: "功能介绍" },
  { value: "tutorial", label: "使用教程" },
  { value: "faq", label: "常见问题" },
  { value: "release_note", label: "版本更新" },
  { value: "case_study", label: "案例研究" },
  { value: "sales_material", label: "销售材料" },
  { value: "marketing_material", label: "营销材料" },
];

const categoryColors: Record<string, string> = {
  feature: "bg-blue-100 text-blue-800",
  tutorial: "bg-green-100 text-green-800",
  faq: "bg-yellow-100 text-yellow-800",
  release_note: "bg-purple-100 text-purple-800",
  case_study: "bg-pink-100 text-pink-800",
  sales_material: "bg-orange-100 text-orange-800",
  marketing_material: "bg-cyan-100 text-cyan-800",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "feature" as Document["category"],
    software_version: "",
    tags: "",
    is_published: true,
  });

  // 获取文档列表
  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Fetch documents error:", error);
      toast({
        title: "获取文档失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "feature",
      software_version: "",
      tags: "",
      is_published: true,
    });
    setEditingDocument(null);
  };

  // 打开编辑对话框
  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      title: doc.title,
      description: doc.description || "",
      content: doc.content,
      category: doc.category,
      software_version: doc.software_version || "",
      tags: doc.tags?.join(", ") || "",
      is_published: doc.is_published,
    });
    setIsDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast({
        title: "请填写必填项",
        description: "标题、内容和分类为必填项",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        id: editingDocument?.id,
      };

      const response = await fetch("/api/documents", {
        method: editingDocument ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: editingDocument ? "文档已更新" : "文档已创建",
          description: data.vectorized
            ? "文档内容已自动向量化入库"
            : "文档已保存，向量化待处理",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchDocuments();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除文档
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文档吗？此操作无法撤销。")) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "文档已删除" });
        fetchDocuments();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "删除失败",
        variant: "destructive",
      });
    }
  };

  // 过滤文档
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">文档管理</h1>
          <p className="text-muted-foreground">
            管理知识库文档，添加的文档会自动向量化以支持智能搜索
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              新建文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? "编辑文档" : "新建文档"}
              </DialogTitle>
              <DialogDescription>
                填写文档信息，保存后会自动进行向量化处理
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="输入文档标题"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="简短描述文档内容"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">分类 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        category: value as Document["category"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">软件版本</Label>
                  <Input
                    id="version"
                    value={formData.software_version}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        software_version: e.target.value,
                      })
                    }
                    placeholder="如: v2.0.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="用逗号分隔多个标签，如: 抠图, 批量处理, 教程"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">内容 * (支持 Markdown)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="输入文档内容，支持 Markdown 格式"
                  className="min-h-[300px] font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存文档"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 文档列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            文档列表 ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无文档</p>
              <p className="text-sm">点击「新建文档」添加第一篇知识库文档</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>浏览</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={categoryColors[doc.category]}
                      >
                        {categories.find((c) => c.value === doc.category)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.software_version || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={doc.is_published ? "default" : "outline"}
                      >
                        {doc.is_published ? "已发布" : "草稿"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {doc.view_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(doc)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
