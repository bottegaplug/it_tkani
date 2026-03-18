export interface Post {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  tags: string[];
  is_new: boolean;
  price: string;
  created_at: string;
}

export interface Tag {
  name: string;
  count: number;
}
