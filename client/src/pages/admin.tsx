import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPostSchema } from "@shared/schema";
import type { DashboardPost, Attachment } from "@shared/schema";
import logoPath from "@assets/Logo_of_Touch_Equity_Partners_1773071901628.png";
import { LogOut, Plus, Pencil, Trash2, Loader2, X, Users, Upload, FileText, Image, Paperclip } from "lucide-react";

type PostWithAssignments = DashboardPost & { assignedCustomerIds: string[] };
type Customer = { id: string; username: string };

const postFormSchema = insertPostSchema.extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  link: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  published: z.boolean().default(false),
  attachments: z.any().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

function getFileIcon(mimetype: string) {
  if (mimetype.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
  if (mimetype === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const [editingPost, setEditingPost] = useState<PostWithAssignments | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAssignments[]>({
    queryKey: ["/api/admin/posts"],
    enabled: !!user && user.role === "admin",
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
    enabled: !!user && user.role === "admin",
  });

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { title: "", content: "", link: "", published: false },
  });

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      const uploaded: Attachment[] = await res.json();
      setCurrentAttachments(prev => [...prev, ...uploaded]);
      toast({ title: `${uploaded.length} file(s) uploaded` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setCurrentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      const payload = {
        ...data,
        link: data.link || null,
        assignedCustomerIds: selectedCustomerIds,
        attachments: currentAttachments,
      };
      const res = await apiRequest("POST", "/api/admin/posts", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      setSelectedCustomerIds([]);
      setCurrentAttachments([]);
      setShowForm(false);
      toast({ title: "Post created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PostFormValues }) => {
      const payload = {
        ...data,
        link: data.link || null,
        assignedCustomerIds: selectedCustomerIds,
        attachments: currentAttachments,
      };
      const res = await apiRequest("PATCH", `/api/admin/posts/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      setEditingPost(null);
      setSelectedCustomerIds([]);
      setCurrentAttachments([]);
      setShowForm(false);
      toast({ title: "Post updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/posts/${id}`, { published });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const onSubmit = (data: PostFormValues) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (post: PostWithAssignments) => {
    setEditingPost(post);
    setShowForm(true);
    setSelectedCustomerIds(post.assignedCustomerIds || []);
    setCurrentAttachments((post.attachments as Attachment[]) || []);
    form.reset({
      title: post.title,
      content: post.content,
      link: post.link || "",
      published: post.published,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setSelectedCustomerIds([]);
    setCurrentAttachments([]);
    form.reset();
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    if (customers) {
      if (selectedCustomerIds.length === customers.length) {
        setSelectedCustomerIds([]);
      } else {
        setSelectedCustomerIds(customers.map(c => c.id));
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/login");
    return null;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getCustomerNames = (ids: string[]) => {
    if (!customers) return [];
    return ids.map(id => customers.find(c => c.id === id)?.username).filter(Boolean) as string[];
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40" data-testid="admin-header">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <img
                  src={logoPath}
                  alt="Touch Equity Partners"
                  className="h-8 w-auto cursor-pointer"
                  data-testid="img-admin-logo"
                />
              </Link>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Admin Panel</span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" data-testid="link-dashboard">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-admin-title">
              Manage Posts
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage dashboard updates for your customers</p>
          </div>
          {!showForm && (
            <Button onClick={() => { setShowForm(true); setEditingPost(null); setSelectedCustomerIds([]); setCurrentAttachments([]); form.reset(); }} data-testid="button-new-post">
              <Plus className="w-4 h-4 mr-1.5" />
              New Post
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="border-none mb-8" data-testid="card-post-form">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg" data-testid="text-form-title">
                {editingPost ? "Edit Post" : "New Post"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={cancelForm} data-testid="button-cancel-form">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Post title" data-testid="input-post-title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message / Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write your message..."
                            className="min-h-[120px] resize-y"
                            data-testid="input-post-content"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com"
                            data-testid="input-post-link"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" />
                      Attachments
                    </FormLabel>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files);
                        }
                      }}
                      data-testid="input-file-upload"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      data-testid="button-upload-files"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1.5" />
                      )}
                      {uploading ? "Uploading..." : "Upload Files"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Images (JPG, PNG, GIF, WebP), PDF, or Word documents. Max 10 MB each.</p>

                    {currentAttachments.length > 0 && (
                      <div className="space-y-2 bg-muted/40 rounded-md p-3">
                        {currentAttachments.map((att, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 py-1">
                            <div className="flex items-center gap-2 min-w-0">
                              {getFileIcon(att.mimetype)}
                              <span className="text-sm truncate">{att.originalName}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(att.size)}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment(i)}
                              data-testid={`button-remove-attachment-${i}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <FormLabel className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Assign to Customers
                      </FormLabel>
                      <button
                        type="button"
                        onClick={selectAllCustomers}
                        className="text-xs text-primary font-medium"
                        data-testid="button-select-all-customers"
                      >
                        {customers && selectedCustomerIds.length === customers.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    {customers && customers.length > 0 ? (
                      <div className="space-y-2 bg-muted/40 rounded-md p-3">
                        {customers.map((customer) => (
                          <label
                            key={customer.id}
                            className="flex items-center gap-3 cursor-pointer py-1"
                            data-testid={`label-customer-${customer.id}`}
                          >
                            <Checkbox
                              checked={selectedCustomerIds.includes(customer.id)}
                              onCheckedChange={() => toggleCustomer(customer.id)}
                              data-testid={`checkbox-customer-${customer.id}`}
                            />
                            <span className="text-sm">{customer.username}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No customers found.</p>
                    )}
                    {selectedCustomerIds.length === 0 && (
                      <p className="text-xs text-muted-foreground">Select at least one customer to show this post on their dashboard.</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-publish"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Publish immediately</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={isPending} data-testid="button-save-post">
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingPost ? "Update Post" : "Create Post"}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelForm} data-testid="button-cancel-post">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none">
                <CardContent className="py-5 px-5">
                  <Skeleton className="h-5 w-48 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => {
              const attachments = (post.attachments as Attachment[]) || [];
              return (
                <Card key={post.id} className="border-none" data-testid={`card-admin-post-${post.id}`}>
                  <CardContent className="py-5 px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground" data-testid={`text-admin-post-title-${post.id}`}>
                          {post.title}
                        </h3>
                        <Badge variant={post.published ? "default" : "secondary"} data-testid={`badge-status-${post.id}`}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                        {attachments.length > 0 && (
                          <Badge variant="secondary">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {attachments.length}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={post.published}
                          onCheckedChange={(checked) => togglePublish.mutate({ id: post.id, published: checked })}
                          data-testid={`switch-toggle-${post.id}`}
                        />
                        <Button variant="ghost" size="icon" onClick={() => startEdit(post)} data-testid={`button-edit-${post.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(post.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                    {post.assignedCustomerIds && post.assignedCustomerIds.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-2" data-testid={`assigned-customers-${post.id}`}>
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {getCustomerNames(post.assignedCustomerIds).map((name, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(!post.assignedCustomerIds || post.assignedCustomerIds.length === 0) && (
                      <p className="text-xs text-muted-foreground/60 mb-2 italic">Not assigned to any customer</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-none" data-testid="card-no-admin-posts">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No posts yet. Create your first post to get started.</p>
              {!showForm && (
                <Button onClick={() => { setShowForm(true); form.reset(); setSelectedCustomerIds([]); setCurrentAttachments([]); }} data-testid="button-first-post">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Post
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
