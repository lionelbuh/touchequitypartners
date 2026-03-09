import { useQuery } from "@tanstack/react-query";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, ExternalLink, FileText, Image, Download } from "lucide-react";
import logoPath from "@assets/Logo_of_Touch_Equity_Partners_1773071901628.png";
import type { DashboardPost, Attachment } from "@shared/schema";

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

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.mimetype.startsWith("image/");

  return (
    <div className="rounded-md border bg-muted/30 overflow-hidden" data-testid={`attachment-${attachment.filename}`}>
      {isImage ? (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={attachment.url}
            alt={attachment.originalName}
            className="w-full max-h-64 object-contain bg-muted/20"
          />
        </a>
      ) : null}
      <div className="flex items-center justify-between gap-2 p-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(attachment.mimetype)}
          <span className="text-sm truncate">{attachment.originalName}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(attachment.size)}</span>
        </div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
          data-testid={`link-download-${attachment.filename}`}
        >
          <Button variant="ghost" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const { data: posts, isLoading: postsLoading } = useQuery<DashboardPost[]>({
    queryKey: ["/api/posts"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40" data-testid="dashboard-header">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <img
                  src={logoPath}
                  alt="Touch Equity Partners"
                  className="h-8 w-auto cursor-pointer"
                  data-testid="img-dashboard-logo"
                />
              </Link>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Dashboard</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-user-email">
                {user.username}
              </span>
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="link-admin-panel">
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-dashboard-welcome">
            Welcome back.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="text-updates-title">
            Updates
          </h2>

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
                  <Card key={post.id} className="border-none" data-testid={`card-post-${post.id}`}>
                    <CardHeader className="pb-2 px-5 pt-5">
                      <CardTitle className="text-base font-semibold" data-testid={`text-post-title-${post.id}`}>
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
                        {post.content}
                      </p>

                      {attachments.length > 0 && (
                        <div className="mt-4 space-y-3" data-testid={`attachments-${post.id}`}>
                          {attachments.map((att, i) => (
                            <AttachmentPreview key={i} attachment={att} />
                          ))}
                        </div>
                      )}

                      {post.link && (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3"
                          data-testid={`link-post-${post.id}`}
                        >
                          Learn more <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-3" data-testid={`text-post-date-${post.id}`}>
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
            <Card className="border-none" data-testid="card-no-posts">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No updates yet. Check back soon.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
