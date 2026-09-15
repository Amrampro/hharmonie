import { useParams } from "react-router-dom";
import { BlogDetailPage } from "../pages/BlogDetailPage";

export function BlogDetailRoute() {
  const { slug } = useParams();
  if (!slug) return null;
  return <BlogDetailPage slug={slug} />;
}
